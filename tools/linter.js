#!/usr/bin/env node
import fs from 'node:fs';
import { fileURLToPath } from 'url';

import { Parser } from '../parser/Parser.js';
import { Lexer } from '../lexer/Lexer.js';
import { Linter } from './lint/Linter.js';

const DEFAULT_RULES = {
    'no-unused-vars': true,
    'prefer-const': true,
    'no-magic-numbers': false
};

export function lintFile(filePath, options = {}) {
    const { quiet = false, rules = {} } = options;
    const enabledRules = { ...DEFAULT_RULES, ...rules };
    
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
        
        const linter = new Linter({ rules: enabledRules });
        const messages = linter.verify(ast, source, filePath);
        
        if (messages.length === 0) {
            if (!quiet) {
                console.log('✅ No problems found.');
            }
            return { ok: true, messages, file: filePath };
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
        return { ok: true, messages, file: filePath };
        
    } catch (err) {
        console.error(`\n\x1b[31m❌ Error linting file ${filePath}:\x1b[0m`);
        if (err.format) {
            const snippet = fs.readFileSync(filePath, 'utf-8').split('\n')[err.location?.line - 1] || '';
            console.error(err.format(snippet));
        } else {
            console.error(err.message);
        }
        return { 
            ok: false, 
            messages: [], 
            file: filePath,
            error: {
                message: err.message,
                line: err.location?.line,
                column: err.location?.column
            }
        };
    }
}

export function lintFileJson(filePath, options = {}) {
    const { rules = {} } = options;
    const enabledRules = { ...DEFAULT_RULES, ...rules };
    
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
        
        const linter = new Linter({ rules: enabledRules });
        const messages = linter.verify(ast, source, filePath);
        
        return { 
            ok: true, 
            file: filePath,
            messages: messages.map(msg => ({
                line: msg.line,
                column: msg.column,
                endColumn: msg.endColumn,
                message: msg.message,
                ruleId: msg.ruleId,
                severity: 'warning'
            }))
        };
        
    } catch (err) {
        return { 
            ok: false, 
            file: filePath,
            error: {
                message: err.message,
                line: err.location?.line || 1,
                column: err.location?.column || 1
            },
            messages: []
        };
    }
}

export function parseRuleFlags(args) {
    const rules = {};
    for (const arg of args) {
        if (arg.startsWith('--rule:')) {
            const ruleDef = arg.slice(7);
            const eqIndex = ruleDef.indexOf('=');
            if (eqIndex !== -1) {
                const ruleName = ruleDef.slice(0, eqIndex);
                const ruleValue = ruleDef.slice(eqIndex + 1).toLowerCase();
                rules[ruleName] = ruleValue === 'true' || ruleValue === '1';
            }
        }
    }
    return rules;
}

// --- Main Execution ---
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const args = process.argv.slice(2);
    const quiet = args.includes('--quiet');
    const json = args.includes('--json');
    const failOnWarning = args.includes('--fail-on-warning');
    const rules = parseRuleFlags(args);
    const filePaths = args.filter(arg => !arg.startsWith('--'));

    if (filePaths.length === 0) {
        console.error('Error: No file path provided.');
        console.log('Usage: node tools/linter.js [--fail-on-warning] [--quiet] [--json] [--rule:name=true|false] <file1.mimo> ...');
        process.exit(1);
    }

    if (json) {
        const results = filePaths.map(path => lintFileJson(path, { rules }));
        console.log(JSON.stringify(results.length === 1 ? results[0] : results));
        const hasErrors = results.some(r => !r.ok);
        const warningCount = results.reduce((sum, r) => sum + r.messages.length, 0);
        if (hasErrors || (failOnWarning && warningCount > 0)) {
            process.exit(1);
        }
    } else {
        let hadErrors = false;
        let warningCount = 0;

        filePaths.forEach(path => {
            const result = lintFile(path, { quiet, rules });
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
}
