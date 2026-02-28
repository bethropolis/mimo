#!/usr/bin/env node
/**
 * Mimo Language Converter - Standardized Entry Point
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ConverterRegistry } from './convert/Registry.js';
import { parseArgs, determineTarget } from './convert/Args.js';
import { Transpiler } from './convert/Transpiler.js';

const converterRegistry = new ConverterRegistry();

async function readStdin() {
    return new Promise((resolve) => {
        let data = '';
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', (chunk) => { data += chunk; });
        process.stdin.on('end', () => { resolve(data); });
    });
}

async function main(providedArgs) {
    const args = providedArgs || process.argv.slice(2);
    const options = parseArgs(args);

    // Initialize the registry by discovering plugins
    await converterRegistry.discoverConverters();

    if ((!options.in && process.stdin.isTTY) || !options.out) {
        const availableLanguages = converterRegistry.getLanguages().join(', ');
        console.error('Usage: mimo convert --in <infile> --out <outfile|outdir> [--to <language>]');
        console.error('Or pipe to stdin: echo "..." | mimo convert --out <outfile> [--to <language>]');
        console.error(`Available target languages: ${availableLanguages}`);
        process.exit(1);
    }

    let targetConfig;
    try {
        targetConfig = determineTarget(options, converterRegistry);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }

    const { language, converterInfo, targetExtension } = targetConfig;
    const transpiler = new Transpiler();

    let outDir;
    let isFileOutput = false;

    if (path.extname(options.out) === targetExtension) {
        outDir = path.dirname(options.out);
        isFileOutput = true;
        console.log(`Converting ${options.in ? `'${options.in}'` : 'STDIN'} to ${language.toUpperCase()} file '${options.out}'...`);
    } else {
        outDir = options.out;
        console.log(`Converting ${options.in ? `'${options.in}'` : 'STDIN'} to ${language.toUpperCase()} in directory '${options.out}'...`);
    }

    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    if (isFileOutput) {
        if (options.in) {
            transpiler.transpileMainFile(options.in, options.out, converterInfo);
        } else {
            const source = await readStdin();
            const output = transpiler.transpileSource(source, 'stdin', converterInfo);
            fs.writeFileSync(options.out, output, 'utf-8');
        }
    } else {
        if (options.in) {
            transpiler.transpileFile(options.in, outDir, converterInfo, targetExtension);
        } else {
            console.error('Error: Directory output requires an input file to resolve dependencies.');
            process.exit(1);
        }

        // Copy runtime if exists
        if (converterInfo.runtimeFile) {
            const __dirname = path.dirname(fileURLToPath(import.meta.url));
            const runtimeSourcePath = path.join(__dirname, 'convert', 'plugins', converterInfo.runtimeFile);
            const runtimeFileName = path.basename(converterInfo.runtimeFile);

            if (fs.existsSync(runtimeSourcePath)) {
                fs.copyFileSync(runtimeSourcePath, path.join(outDir, runtimeFileName));
                console.log(` -> Copied runtime: ${runtimeFileName}`);
            }
        }
    }

    console.log(`✅ Conversion to ${language.toUpperCase()} successful!`);
}

export { main as runConverter };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}