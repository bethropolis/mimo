#!/usr/bin/env node
import fs from 'node:fs';
import { fileURLToPath } from 'url';
import { Parser } from '../parser/Parser.js';
import { Lexer } from '../lexer/Lexer.js';
import { PrettyPrinter } from './PrettyPrinter.js';

export function formatFile(filePath, options = {}) {
    const { write = false, check = false, quiet = false } = options;
    if (!quiet) {
        console.log(`Formatting ${filePath}...`);
    }
    try {
        const source = fs.readFileSync(filePath, 'utf-8');
        
        // 1. Lex the source code
        const lexer = new Lexer(source, filePath);
        const tokens = [];
        let token;
        while ((token = lexer.nextToken()) !== null) {
            tokens.push(token);
        }
        
        // 2. Parse the tokens into an AST
        const parser = new Parser(tokens, filePath);
        const ast = parser.parse();
        
        // 3. Pretty-print the AST
        const printer = new PrettyPrinter();
        const formattedSource = printer.format(ast);
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
        // If it's a MimoError, use its format method.
        if (err.format) {
            const snippet = fs.readFileSync(filePath, 'utf-8').split('\n')[err.location.line - 1] || '';
            console.error(err.format(snippet));
        } else {
            console.error(err.message);
        }
        return { ok: false, changed: false, error: err };
    }
}


// --- Main Execution ---
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const args = process.argv.slice(2);
    const shouldWrite = args.includes('--write');
    const shouldCheck = args.includes('--check');
    const quiet = args.includes('--quiet');
    const filePaths = args.filter(arg => !arg.startsWith('--'));

    if (filePaths.length === 0) {
        console.error('Error: No file path provided.');
        console.log('Usage: node tools/formatter.js [--write|--check] [--quiet] <file1.mimo> ...');
        process.exit(1);
    }

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
