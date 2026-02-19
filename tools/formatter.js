#!/usr/bin/env node
import fs from 'node:fs';
import { fileURLToPath } from 'url';
import { Parser } from '../parser/Parser.js';
import { Lexer } from '../lexer/Lexer.js';
import { PrettyPrinter } from './PrettyPrinter.js';

/**
 * Formats Mimo source code from a string.
 * @param {string} source The Mimo source code to format.
 * @param {string} [filePath] Optional file path for error reporting.
 * @returns {string} The formatted source code.
 */
export function formatSource(source, filePath = 'snippet.mimo') {
    const lexer = new Lexer(source, filePath);
    const tokens = [];
    let token;
    while ((token = lexer.nextToken()) !== null) {
        tokens.push(token);
    }
    
    const parser = new Parser(tokens, filePath);
    const ast = parser.parse();
    
    const printer = new PrettyPrinter();
    return printer.format(ast);
}

/**
 * Formats a Mimo file on disk.
 * @param {string} filePath Path to the file.
 * @param {object} [options] Options: { write, check, quiet }
 * @returns {object} { ok, changed, error }
 */
export function formatFile(filePath, options = {}) {
    const { write = false, check = false, quiet = false } = options;
    if (!quiet) {
        console.log(`Formatting ${filePath}...`);
    }
    try {
        const source = fs.readFileSync(filePath, 'utf-8');
        const formattedSource = formatSource(source, filePath);
        const changed = formattedSource !== source;
        
        if (write) {
            if (changed) {
                fs.writeFileSync(filePath, formattedSource, 'utf-8');
                if (!quiet) {
                    console.log(`✅ File formatted successfully.`);
                }
            } else if (!quiet) {
                console.log('✅ Already formatted.');
            }
            return { ok: true, changed };
        }

        if (check) {
            if (changed) {
                console.log(`❌ ${filePath} is not formatted.`);
            } else if (!quiet) {
                console.log(`✅ ${filePath} is formatted.`);
            }
            return { ok: true, changed };
        } else {
            console.log('\n--- Formatted Output ---');
            console.log(formattedSource);
            console.log('--- End Output ---');
            console.log('\nUse --write flag to apply changes to the file.');
            return { ok: true, changed };
        }
    } catch (err) {
        console.error(`❌ Error formatting file ${filePath}:`);
        if (err.format) {
            const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
            const lines = content.split('\n');
            const snippet = lines[err.location?.line - 1] || '';
            console.error(err.format(snippet));
        } else {
            console.error(err.message);
        }
        return { ok: false, changed: false, error: err };
    }
}

async function readStdin() {
    return new Promise((resolve) => {
        let data = '';
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', (chunk) => { data += chunk; });
        process.stdin.on('end', () => { resolve(data); });
    });
}

// --- Main Execution ---
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const args = process.argv.slice(2);
    const shouldWrite = args.includes('--write');
    const shouldCheck = args.includes('--check');
    const quiet = args.includes('--quiet');
    const filePaths = args.filter(arg => !arg.startsWith('--'));

    if (filePaths.length === 0 || filePaths.includes('-')) {
        if (!process.stdin.isTTY || filePaths.includes('-')) {
            readStdin().then(source => {
                try {
                    const formatted = formatSource(source, 'stdin');
                    process.stdout.write(formatted);
                } catch (err) {
                    console.error(err.message);
                    process.exit(1);
                }
            });
        } else {
            console.error('Error: No file path provided and STDIN is a TTY.');
            console.log('Usage: node tools/formatter.js [--write|--check] [--quiet] <file1.mimo> ...');
            console.log('Or pipe source to stdin: echo "..." | node tools/formatter.js');
            process.exit(1);
        }
    } else {
        let hadErrors = false;
        let hadUnformatted = false;

        filePaths.forEach(path => {
            const result = formatFile(path, { write: shouldWrite, check: shouldCheck, quiet });
            if (!result.ok) hadErrors = true;
            if (shouldCheck && result.changed) hadUnformatted = true;
        });

        if (hadErrors || hadUnformatted) {
            process.exit(1);
        }
    }
}
