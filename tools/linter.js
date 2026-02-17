#!/usr/bin/env node
import fs from 'node:fs';
import { fileURLToPath } from 'url';

import { Parser } from '../parser/Parser.js';
import { Lexer } from '../lexer/Lexer.js';
import { Linter } from './lint/Linter.js';

export function lintFile(filePath, options = {}) {
    const { quiet = false } = options;
    if (!quiet) {
        console.log(`Linting ${filePath}...`);
    }
    try {
        const source = fs.readFileSync(filePath, 'utf-8');
        
        const lexer = new Lexer(source, filePath);
        const tokens = [];
        let token;
        while ((token = lexer.nextToken()) !== null) {
            tokens.push(token);
        }
        
        const parser = new Parser(tokens, filePath);
        const ast = parser.parse();
        
        const linter = new Linter();
        const messages = linter.verify(ast, source, filePath);
        
        if (messages.length === 0) {
            if (!quiet) {
                console.log('✅ No problems found.');
            }
            return { ok: true, messages };
        }

        console.log(`\nFound ${messages.length} problem(s) in ${filePath}:`);
        
        const sourceLines = source.split('\n');
        messages.forEach(msg => {
            console.log(`\n  \x1b[36m${filePath}:${msg.line}:${msg.column}\x1b[0m`);
            console.log(`  \x1b[33mwarning\x1b[0m  ${msg.message}  \x1b[90m${msg.ruleId}\x1b[0m`);
            
            const line = sourceLines[msg.line - 1];
            if (line) {
                console.log(`\n  ${msg.line} | ${line}`);
                const padding = ' '.repeat(String(msg.line).length + 3 + msg.column - 1);
                const squiggles = '^'.repeat(Math.max(1, msg.endColumn - msg.column));
                console.log(`  ${padding}\x1b[33m${squiggles}\x1b[0m`);
            }
        });
        return { ok: true, messages };
        
    } catch (err) {
        console.error(`\n\x1b[31m❌ Error linting file ${filePath}:\x1b[0m`);
        if (err.format) {
            const snippet = fs.readFileSync(filePath, 'utf-8').split('\n')[err.location.line - 1] || '';
            console.error(err.format(snippet));
        } else {
            console.error(err.message);
        }
        return { ok: false, messages: [], error: err };
    }
}

// --- Main Execution ---
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const args = process.argv.slice(2);
    const quiet = args.includes('--quiet');
    const failOnWarning = args.includes('--fail-on-warning');
    const filePaths = args.filter(arg => !arg.startsWith('--'));

    if (filePaths.length === 0) {
        console.error('Error: No file path provided.');
        console.log('Usage: node tools/linter.js [--fail-on-warning] [--quiet] <file1.mimo> ...');
        process.exit(1);
    }

    let hadErrors = false;
    let warningCount = 0;

    filePaths.forEach(path => {
        const result = lintFile(path, { quiet });
        if (!result.ok) {
            hadErrors = true;
            return;
        }
        warningCount += result.messages.length;
    });

    if (hadErrors || (failOnWarning && warningCount > 0)) {
        process.exit(1);
    }
}
