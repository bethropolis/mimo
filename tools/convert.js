#!/usr/bin/env node
/**
 * Mimo Language Converter
 * 
 * A flexible transpiler that converts Mimo source code to various target languages.
 * 
 * Features:
 * - Modular converter system with language registration
 * - Auto-detection of target language from output file extension
 * - Support for both single file and directory output
 * - Runtime file copying for languages that need it
 * 
 * Usage:
 *   node tools/convert.js --in <source.mimo> --out <output.ext> [--to <language>]
 *   node tools/convert.js --in <source.mimo> --out <output_dir> --to <language>
 * 
 * Directory Structure:
 *   tools/converters/<language>/
 *     ├── to_<lang>.js       # Converter implementation
 *     └── mimo_runtime.<ext> # Runtime library for target language
 * 
 * Adding New Languages:
 * 1. Create directory: tools/converters/<language>/
 * 2. Create converter: tools/converters/<language>/to_<lang>.js
 * 3. Create runtime: tools/converters/<language>/mimo_runtime.<ext>
 * 4. Import and register in setupDefaultConverters()
 * 
 * Example:
 *   import { MimoToGoConverter } from './converters/go/to_go.js';
 *   converterRegistry.register('go', '.go', MimoToGoConverter, 'go/mimo_runtime.go');
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Parser } from '../parser/Parser.js';
import { Lexer } from '../lexer/Lexer.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Converter registry system
class ConverterRegistry {
    constructor() {
        this.converters = new Map();
    }

    /**
     * Register a converter for a target language
     * @param {string} language - Target language identifier (e.g., 'js', 'py', 'go')
     * @param {string} extension - File extension for the target language (e.g., '.js', '.py', '.go')
     * @param {class} ConverterClass - The converter class
     * @param {string} [runtimeFile] - Optional runtime file to copy
     */
    register(language, extension, ConverterClass, runtimeFile = null) {
        this.converters.set(language, {
            extension,
            ConverterClass,
            runtimeFile
        });
    }

    /**
     * Get converter info for a language
     * @param {string} language - Target language identifier
     * @returns {Object|null} Converter info or null if not found
     */
    get(language) {
        return this.converters.get(language) || null;
    }

    /**
     * Get all registered languages
     * @returns {Array<string>} Array of language identifiers
     */
    getLanguages() {
        return Array.from(this.converters.keys());
    }

    /**
     * Detect target language from file extension
     * @param {string} filePath - Output file path
     * @returns {string|null} Language identifier or null if not detected
     */
    detectLanguageFromExtension(filePath) {
        const ext = path.extname(filePath);
        for (const [lang, info] of this.converters) {
            if (info.extension === ext) {
                return lang;
            }
        }
        return null;
    }

    /**
     * Dynamically scan the converters directory and load all plugins
     */
    async discoverConverters() {
        const convertersDir = path.join(__dirname, 'converters');
        if (!fs.existsSync(convertersDir)) return;

        const entries = fs.readdirSync(convertersDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const langDir = path.join(convertersDir, entry.name);
                const indexPath = path.join(langDir, 'index.js');

                if (fs.existsSync(indexPath)) {
                    try {
                        // Use dynamic import with file URL for Windows compatibility
                        const modulePath = `file://${indexPath}`;
                        const { config, Converter } = await import(modulePath);

                        if (config && Converter) {
                            const { name, aliases, extension, runtimeFile } = config;

                            // Register main name and all aliases
                            const regName = name || entry.name;
                            const runtimePath = runtimeFile ? path.join(entry.name, runtimeFile) : null;

                            this.register(regName, extension, Converter, runtimePath);

                            if (aliases && Array.isArray(aliases)) {
                                for (const alias of aliases) {
                                    if (alias !== regName) {
                                        this.register(alias, extension, Converter, runtimePath);
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.warn(`Warning: Failed to load converter in ${entry.name}: ${error.message}`);
                    }
                }
            }
        }
    }
}

const converterRegistry = new ConverterRegistry();

function parseArgs(args) {
    const options = {};
    if (args.length === 2 && !args[0].startsWith('--')) {
        // Simple positional arguments: mimo_in mimo_out
        options.in = args[0];
        options.out = args[1];
        options.to = 'js'; // Default to JS
        return options;
    }
    for (let i = 0; i < args.length; i += 2) {
        const flag = args[i];
        const value = args[i + 1];
        if (flag.startsWith('--')) {
            options[flag.substring(2)] = value;
        }
    }
    return options;
}

/**
 * Determine the target language and converter to use
 * @param {Object} options - Parsed command line options
 * @returns {Object} Object containing language, converterInfo, and targetExtension
 */
function determineTarget(options) {
    let targetLanguage = options.to;

    // If no target specified, try to detect from output file extension
    if (!targetLanguage && options.out) {
        targetLanguage = converterRegistry.detectLanguageFromExtension(options.out);
    }

    // Default to JavaScript if still not determined
    if (!targetLanguage) {
        targetLanguage = 'js';
    }

    const converterInfo = converterRegistry.get(targetLanguage);
    if (!converterInfo) {
        const availableLanguages = converterRegistry.getLanguages().join(', ');
        throw new Error(`Unsupported target language: ${targetLanguage}. Available: ${availableLanguages}`);
    }

    return {
        language: targetLanguage,
        converterInfo,
        targetExtension: converterInfo.extension
    };
}


const processedFiles = new Set();

function transpileMainFile(filePath, outPath, converterInfo) {
    console.log(` -> Transpiling: ${filePath}`);

    const source = fs.readFileSync(filePath, 'utf-8');
    const sourcePath = path.resolve(filePath);

    const lexer = new Lexer(source, sourcePath);
    const tokens = [];
    let token;
    while ((token = lexer.nextToken()) !== null) tokens.push(token);

    const parser = new Parser(tokens, sourcePath);
    const ast = parser.parse();

    // Convert the AST using the appropriate converter
    const converter = new converterInfo.ConverterClass();
    const output = converter.convert(ast);

    fs.writeFileSync(outPath, output, 'utf-8');
}

function transpileFile(filePath, outDir, converterInfo, targetExtension) {
    if (processedFiles.has(filePath)) {
        return; // Already processed this file in this run
    }
    processedFiles.add(filePath);
    console.log(` -> Transpiling: ${filePath}`);

    const source = fs.readFileSync(filePath, 'utf-8');
    const sourcePath = path.resolve(filePath);

    const lexer = new Lexer(source, sourcePath);
    const tokens = [];
    let token;
    while ((token = lexer.nextToken()) !== null) tokens.push(token);

    const parser = new Parser(tokens, sourcePath);
    const ast = parser.parse();

    // After parsing, check for more imports to process
    ast.body.forEach(stmt => {
        if (stmt.type === 'ImportStatement') {
            const modulePath = stmt.path;
            // Ignore stdlib modules
            if (!['fs', 'math', 'string', 'array', 'json', 'datetime'].includes(modulePath)) {
                // Construct the path to the Mimo source file to be imported
                let nextFilePath = path.resolve(path.dirname(filePath), modulePath);
                if (!nextFilePath.endsWith('.mimo')) {
                    nextFilePath += '.mimo';
                }

                if (fs.existsSync(nextFilePath)) {
                    // Recursively transpile the dependency
                    transpileFile(nextFilePath, outDir, converterInfo, targetExtension);
                } else {
                    console.warn(`Warning: Imported file not found, skipping: ${nextFilePath}`);
                }
            }
        }
    });

    // Now, convert the current file's AST using the appropriate converter
    const converter = new converterInfo.ConverterClass();
    const output = converter.convert(ast);

    // Determine the output path with correct extension
    const baseName = path.basename(filePath, '.mimo');
    const outPath = path.join(outDir, `${baseName}${targetExtension}`);

    fs.writeFileSync(outPath, output, 'utf-8');
}

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
        console.error('Usage: node tools/convert.js --in <infile> --out <outfile|outdir> [--to <language>]');
        console.error('Or pipe to stdin: echo "..." | node tools/convert.js --out <outfile> [--to <language>]');
        console.error(`Available target languages: ${availableLanguages}`);
        process.exit(1);
    }

    let targetConfig;
    try {
        targetConfig = determineTarget(options);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }

    const { language, converterInfo, targetExtension } = targetConfig;

    let outDir;
    let isFileOutput = false;

    // Check if the output is a file or a directory
    // If it has an extension that matches our target, treat it as a file
    if (path.extname(options.out) === targetExtension) {
        // Output is a file, so extract the directory
        outDir = path.dirname(options.out);
        isFileOutput = true;
        if (options.in) {
            console.log(`Converting '${options.in}' to ${language.toUpperCase()} file '${options.out}'...`);
        } else {
            console.log(`Converting STDIN to ${language.toUpperCase()} file '${options.out}'...`);
        }
    } else {
        // Output is a directory
        outDir = options.out;
        if (options.in) {
            console.log(`Converting '${options.in}' to ${language.toUpperCase()} in directory '${options.out}'...`);
        } else {
            console.log(`Converting STDIN to ${language.toUpperCase()} in directory '${options.out}'...`);
        }
    }

    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    // Clear processed files set for this run
    processedFiles.clear();

    // Start the transpilation process
    if (isFileOutput) {
        // For single file output, only transpile the main file
        if (options.in) {
            transpileMainFile(options.in, options.out, converterInfo);
        } else {
            const source = await readStdin();
            const lexer = new Lexer(source, 'stdin');
            const tokens = [];
            let token;
            while ((token = lexer.nextToken()) !== null) tokens.push(token);
            const parser = new Parser(tokens, 'stdin');
            const ast = parser.parse();
            const converter = new converterInfo.ConverterClass();
            const output = converter.convert(ast);
            fs.writeFileSync(options.out, output, 'utf-8');
        }
    } else {
        // For directory output, transpile all files recursively
        if (options.in) {
            transpileFile(options.in, outDir, converterInfo, targetExtension);
        } else {
            console.error('Error: Directory output requires an input file to resolve dependencies.');
            process.exit(1);
        }

        // Copy the runtime file if specified for directory output
        if (converterInfo.runtimeFile) {
            const __dirname = path.dirname(fileURLToPath(import.meta.url));
            const runtimeSourcePath = path.join(__dirname, 'converters', converterInfo.runtimeFile);
            const runtimeFileName = path.basename(converterInfo.runtimeFile);
            if (fs.existsSync(runtimeSourcePath)) {
                fs.copyFileSync(runtimeSourcePath, path.join(outDir, runtimeFileName));
                console.log(` -> Copied runtime: ${runtimeFileName}`);
            } else {
                console.warn(`Warning: Runtime file not found: ${runtimeSourcePath}`);
            }
        }
    }

    console.log(`✅ Conversion to ${language.toUpperCase()} successful!`);
}

// Export for use in CLI
export { main as runConverter };

// Only run if this file is the main module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}