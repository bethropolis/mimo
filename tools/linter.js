#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

import { Parser } from '../parser/Parser.js';
import { Lexer } from '../lexer/Lexer.js';
import { Linter } from './lint/Linter.js';
import { loadConfig, findConfigFile, mergeRuleConfigs } from './lint/config.js';

const DEFAULT_RULES = {
    'no-unused-vars':    true,
    'prefer-const':      true,
    'no-magic-numbers':  false,
    'no-empty-function': false,
    'max-depth':         false,
    'no-shadow':         false,
    'consistent-return': false,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Synchronous fs reader — injected into config helpers so they stay bundler-safe. */
const fsReadFile = (p) => fs.readFileSync(p, 'utf-8');

/**
 * Resolve the merged rule config for a given file path.
 * Priority: DEFAULT_RULES < .mimorc < caller-supplied `rules` overrides.
 */
function resolveRules(filePath, callerRules = {}) {
    const fileDir  = path.dirname(path.resolve(filePath));
    const rootDir  = path.resolve('/');
    const pathJoin = path.join.bind(path);

    const configPath = findConfigFile(fileDir, rootDir, fsReadFile, pathJoin);
    const fileConfig = configPath ? loadConfig(configPath, fsReadFile) : { rules: {} };

    return mergeRuleConfigs(DEFAULT_RULES, fileConfig.rules, callerRules);
}

/** Parse source into an AST. Throws on syntax errors. */
function parseSource(source, filePath) {
    const lexer = new Lexer(source, filePath);
    const tokens = [];
    let token;
    while ((token = lexer.nextToken()) !== null) {
        tokens.push(token);
    }
    const parser = new Parser(tokens, filePath);
    return parser.parse();
}

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------
const RESET  = '\x1b[0m';
const CYAN   = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const DIM    = '\x1b[90m';

function severityLabel(severity) {
    return severity === 'error'
        ? `${RED}error${RESET}`
        : `${YELLOW}warning${RESET}`;
}

function squiggleColor(severity) {
    return severity === 'error' ? RED : YELLOW;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function lintFile(filePath, options = {}) {
    const { quiet = false, rules = {} } = options;
    const enabledRules = resolveRules(filePath, rules);

    if (!quiet) {
        console.log(`Linting ${filePath}...`);
    }
    try {
        const source = fs.readFileSync(filePath, 'utf-8');
        const ast    = parseSource(source, filePath);

        const linter   = new Linter({ rules: enabledRules });
        const messages = linter.verify(ast, source, filePath);

        const errors   = messages.filter(m => m.severity === 'error');
        const warnings = messages.filter(m => m.severity !== 'error');

        if (messages.length === 0) {
            if (!quiet) {
                console.log('No problems found.');
            }
            return { ok: true, messages, errorCount: 0, warningCount: 0, file: filePath };
        }

        console.log(`\nFound ${messages.length} problem(s) in ${filePath}:`);

        const sourceLines = source.split('\n');
        messages.forEach(msg => {
            const color = squiggleColor(msg.severity);
            console.log(`\n  ${CYAN}${filePath}:${msg.line}:${msg.column}${RESET}`);
            console.log(`  ${severityLabel(msg.severity)}  ${msg.message}  ${DIM}${msg.ruleId}${RESET}`);

            const line = sourceLines[msg.line - 1];
            if (line) {
                console.log(`\n  ${msg.line} | ${line}`);
                const padding   = ' '.repeat(String(msg.line).length + 3 + msg.column - 1);
                const squiggles = '^'.repeat(Math.max(1, msg.endColumn - msg.column));
                console.log(`  ${padding}${color}${squiggles}${RESET}`);
            }
        });

        return {
            ok: true,
            messages,
            errorCount:   errors.length,
            warningCount: warnings.length,
            file: filePath,
        };

    } catch (err) {
        console.error(`\n${RED}Error linting file ${filePath}:${RESET}`);
        if (err.format) {
            const snippet = fs.readFileSync(filePath, 'utf-8').split('\n')[err.location?.line - 1] || '';
            console.error(err.format(snippet));
        } else {
            console.error(err.message);
        }
        return {
            ok:           false,
            messages:     [],
            errorCount:   0,
            warningCount: 0,
            file:         filePath,
            error: {
                message: err.message,
                line:    err.location?.line,
                column:  err.location?.column,
            },
        };
    }
}

export function lintFileJson(filePath, options = {}) {
    const { rules = {} } = options;
    const enabledRules = resolveRules(filePath, rules);

    try {
        const source = fs.readFileSync(filePath, 'utf-8');
        const ast    = parseSource(source, filePath);

        const linter   = new Linter({ rules: enabledRules });
        const messages = linter.verify(ast, source, filePath);

        return {
            ok:   true,
            file: filePath,
            messages: messages.map(msg => ({
                line:      msg.line,
                column:    msg.column,
                endColumn: msg.endColumn,
                message:   msg.message,
                ruleId:    msg.ruleId,
                severity:  msg.severity,   // use actual severity, not hard-coded 'warning'
            })),
        };

    } catch (err) {
        return {
            ok:   false,
            file: filePath,
            error: {
                message: err.message,
                line:    err.location?.line   || 1,
                column:  err.location?.column || 1,
            },
            messages: [],
        };
    }
}

/**
 * Parse `--rule:name=true|false` flags from a CLI args array.
 * Supports an optional severity suffix: `--rule:name=error` or `--rule:name=warning`.
 */
export function parseRuleFlags(args) {
    const rules = {};
    for (const arg of args) {
        if (arg.startsWith('--rule:')) {
            const ruleDef  = arg.slice(7);
            const eqIndex  = ruleDef.indexOf('=');
            if (eqIndex !== -1) {
                const ruleName  = ruleDef.slice(0, eqIndex);
                const ruleValue = ruleDef.slice(eqIndex + 1).toLowerCase();
                if (ruleValue === 'false' || ruleValue === '0') {
                    rules[ruleName] = false;
                } else if (ruleValue === 'true' || ruleValue === '1') {
                    rules[ruleName] = true;
                } else if (ruleValue === 'error' || ruleValue === 'warning') {
                    rules[ruleName] = { severity: ruleValue };
                } else {
                    rules[ruleName] = true; // unknown value — treat as enable
                }
            }
        }
    }
    return rules;
}

// ---------------------------------------------------------------------------
// Main (direct invocation)
// ---------------------------------------------------------------------------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const args          = process.argv.slice(2);
    const quiet         = args.includes('--quiet');
    const json          = args.includes('--json');
    const failOnWarning = args.includes('--fail-on-warning');
    const rules         = parseRuleFlags(args);
    const filePaths     = args.filter(arg => !arg.startsWith('--'));

    if (filePaths.length === 0) {
        console.error('Error: No file path provided.');
        console.log('Usage: node tools/linter.js [--fail-on-warning] [--quiet] [--json] [--rule:name=true|false|error|warning] <file1.mimo> ...');
        process.exit(1);
    }

    if (json) {
        const results = filePaths.map(p => lintFileJson(p, { rules }));
        console.log(JSON.stringify(results.length === 1 ? results[0] : results));
        const hasParseErrors = results.some(r => !r.ok);
        const errorCount     = results.reduce((sum, r) => sum + r.messages.filter(m => m.severity === 'error').length, 0);
        const warningCount   = results.reduce((sum, r) => sum + r.messages.filter(m => m.severity !== 'error').length, 0);
        if (hasParseErrors || errorCount > 0 || (failOnWarning && warningCount > 0)) {
            process.exit(1);
        }
    } else {
        let hasParseErrors = false;
        let errorCount     = 0;
        let warningCount   = 0;

        filePaths.forEach(p => {
            const result = lintFile(p, { quiet, rules });
            if (!result.ok) {
                hasParseErrors = true;
                return;
            }
            errorCount   += result.errorCount;
            warningCount += result.warningCount;
        });

        if (hasParseErrors || errorCount > 0 || (failOnWarning && warningCount > 0)) {
            process.exit(1);
        }
    }
}
