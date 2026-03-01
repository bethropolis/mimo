/**
 * @file The Mimo library entry point for BROWSER environments.
 * It exports the Mimo class but avoids importing any Node.js-specific modules.
 */

import { Interpreter } from './interpreter/index.js';
import { Lexer } from './lexer/Lexer.js';
import { Parser } from './parser/Parser.js';
import { MimoError } from './interpreter/MimoError.js';
import { Linter } from './tools/lint/Linter.js';
import { PrettyPrinter } from './tools/PrettyPrinter.js';
import { extractComments } from './tools/format/CommentLexer.js';
import { attachComments } from './tools/format/CommentAttacher.js';

/**
 * Tokenizer module - handles lexical analysis
 */
export class MimoTokenizer {
    constructor(source, filePath = '/playground.mimo') {
        this.source = source;
        this.filePath = filePath;
        this.lexer = new Lexer(source, filePath);
    }

    tokenize() {
        const tokens = [];
        let token;
        while ((token = this.lexer.nextToken()) !== null) {
            tokens.push(token);
        }
        return tokens;
    }
}

/**
 * Parser module - handles syntax analysis
 */
export class MimoParser {
    constructor(tokens, filePath = '/playground.mimo', errorHandler = null) {
        this.tokens = tokens;
        this.filePath = filePath;
        this.parser = new Parser(tokens, filePath);
        if (errorHandler) {
            this.parser.setErrorHandler(errorHandler);
        }
    }

    parse() {
        return this.parser.parse();
    }
}

/**
 * AST Hook Manager - manages AST interception callbacks
 */
export class ASTHookManager {
    constructor() {
        this.hooks = [];
    }

    /**
     * Register a callback to receive the AST
     * @param {Function} callback - Function that receives (ast, filePath) as parameters
     * @param {string} [name] - Optional name for the hook
     */
    registerHook(callback, name = null) {
        if (typeof callback !== 'function') {
            throw new Error('AST hook must be a function');
        }
        
        const hook = {
            callback,
            name: name || `hook_${this.hooks.length}`,
            id: Date.now() + Math.random()
        };
        
        this.hooks.push(hook);
        return hook.id;
    }

    /**
     * Unregister a hook by ID
     * @param {string|number} hookId - The ID returned by registerHook
     */
    unregisterHook(hookId) {
        this.hooks = this.hooks.filter(hook => hook.id !== hookId);
    }

    /**
     * Unregister all hooks with a specific name
     * @param {string} name - The name of hooks to remove
     */
    unregisterHooksByName(name) {
        this.hooks = this.hooks.filter(hook => hook.name !== name);
    }

    /**
     * Clear all registered hooks
     */
    clearHooks() {
        this.hooks = [];
    }

    /**
     * Execute all registered hooks with the AST
     * @param {Object} ast - The parsed AST
     * @param {string} filePath - The file path
     */
    executeHooks(ast, filePath) {
        for (const hook of this.hooks) {
            try {
                hook.callback(ast, filePath);
            } catch (error) {
                console.error(`Error in AST hook '${hook.name}':`, error);
            }
        }
    }

    /**
     * Get list of registered hooks
     */
    getHooks() {
        return this.hooks.map(hook => ({
            id: hook.id,
            name: hook.name
        }));
    }
}

/**
 * Main Mimo class with modular design and AST interception
 */
export class Mimo {
    constructor(adapter, options = {}) {
        if (!adapter) {
            throw new Error("Mimo constructor requires an adapter object.");
        }
        
        this.interpreter = new Interpreter(adapter);
        this.astHookManager = new ASTHookManager();
        
        // Configuration options
        this.options = {
            enableASTHooks: options.enableASTHooks !== false, 
            throwOnHookError: options.throwOnHookError || false,
            ...options
        };
    }

    /**
     * Register an AST hook
     * @param {Function} callback - Function that receives (ast, filePath)
     * @param {string} [name] - Optional name for the hook
     * @returns {string|number} Hook ID for later removal
     */
    onAST(callback, name) {
        return this.astHookManager.registerHook(callback, name);
    }

    /**
     * Remove an AST hook by ID
     * @param {string|number} hookId - The hook ID
     */
    offAST(hookId) {
        this.astHookManager.unregisterHook(hookId);
    }

    /**
     * Get the AST hook manager for advanced hook management
     */
    getASTHookManager() {
        return this.astHookManager;
    }

    /**
     * Tokenize source code
     * @param {string} source - The source code
     * @param {string} [filePath] - Optional file path
     * @returns {Array} Array of tokens
     */
    tokenize(source, filePath = '/playground.mimo') {
        const tokenizer = new MimoTokenizer(source, filePath);
        return tokenizer.tokenize();
    }

    /**
     * Parse tokens into an AST
     * @param {Array} tokens - Array of tokens
     * @param {string} [filePath] - Optional file path
     * @returns {Object} The parsed AST
     */
    parse(tokens, filePath = '/playground.mimo') {
        const parser = new MimoParser(tokens, filePath, this.interpreter.errorHandler);
        this.interpreter.errorHandler.addSourceFile(filePath, ''); // Add empty source for now
        return parser.parse();
    }

    /**
     * Parse source code directly into an AST
     * @param {string} source - The source code
     * @param {string} [filePath] - Optional file path
     * @returns {Object} The parsed AST
     */
    parseSource(source, filePath = '/playground.mimo') {
        const tokens = this.tokenize(source, filePath);
        this.interpreter.errorHandler.addSourceFile(filePath, source);
        const parser = new MimoParser(tokens, filePath, this.interpreter.errorHandler);
        const ast = parser.parse();
        
        // Execute AST hooks if enabled
        if (this.options.enableASTHooks) {
            this.astHookManager.executeHooks(ast, filePath);
        }
        
        return ast;
    }

    /**
     * Run source code with full pipeline
     * @param {string} source - The source code
     * @param {string} [filePath] - Optional file path
     * @returns {*} The execution result
     */
    run(source, filePath = '/playground.mimo') {
        const effectivePath = filePath;

        try {
            // Tokenize
            const tokens = this.tokenize(source, effectivePath);
            
            // Parse and get AST
            const ast = this.parseSource(source, effectivePath);

            // Interpret
            const result = this.interpreter.interpret(ast, effectivePath);

            return result;

        } catch (error) {
            if (error instanceof MimoError) {
                throw error.format(this.interpreter.errorHandler.getLine(error.location.file, error.location.line));
            } else {
                throw error;
            }
        }
    }

    /**
     * Run pre-parsed AST
     * @param {Object} ast - The parsed AST
     * @param {string} [filePath] - Optional file path
     * @returns {*} The execution result
     */
    runAST(ast, filePath = '/playground.mimo') {
        try {
            return this.interpreter.interpret(ast, filePath);
        } catch (error) {
            if (error instanceof MimoError) {
                throw error.format(this.interpreter.errorHandler.getLine(error.location.file, error.location.line));
            } else {
                throw error;
            }
        }
    }
}

// Export all classes and modules
export { Interpreter } from './interpreter/index.js';
export { Lexer } from './lexer/Lexer.js';
export { Parser } from './parser/Parser.js';
export { MimoError } from './interpreter/MimoError.js';
export { Linter } from './tools/lint/Linter.js';
export { PrettyPrinter } from './tools/PrettyPrinter.js';

const DEFAULT_LINT_RULES = {
    'no-unused-vars': true,
    'prefer-const': true,
    'no-magic-numbers': false
};

export function lintSource(source, filePath = '/playground.mimo', rules = {}) {
    const enabledRules = { ...DEFAULT_LINT_RULES, ...rules };
    
    try {
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
        // Convert syntax/parse errors into lint diagnostics
        return { 
            ok: false, 
            file: filePath,
            error: {
                message: err.message,
                line: err.location?.line || 1,
                column: err.location?.column || 1
            },
            messages: [{
                line: err.location?.line || 1,
                column: err.location?.column || 1,
                endColumn: (err.location?.column || 1) + 1,
                message: err.message,
                ruleId: 'syntax-error',
                severity: 'error'
            }]
        };
    }
}

export function formatSource(source) {
    try {
        // Extract comments from raw source (formatter-only path)
        const { comments } = extractComments(source);

        const lexer = new Lexer(source, '/format.mimo');
        const tokens = [];
        let token;
        while ((token = lexer.nextToken()) !== null) {
            tokens.push(token);
        }

        const parser = new Parser(tokens, '/format.mimo');
        const ast = parser.parse();

        // Attach extracted comments to AST nodes
        attachComments(ast, comments);

        const printer = new PrettyPrinter();
        // A8: format() already normalises the trailing newline
        const formatted = printer.format(ast);

        return {
            ok: true,
            formatted,
        };
    } catch (err) {
        return {
            ok: false,
            error: err.message,
        };
    }
}
