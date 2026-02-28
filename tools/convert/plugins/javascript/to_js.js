/**
 * Mimo → JavaScript transpiler.
 *
 * Converts a Mimo AST to idiomatic ES2022 JavaScript (ESM).
 * Extends BaseConverter for shared infrastructure; visitor methods are
 * mixed in from focused sub-modules.
 */
import { BaseConverter } from '../base_converter.js';
import { statementVisitors } from './visitors/statements.js';
import { expressionVisitors } from './visitors/expressions.js';
import { patternVisitors } from './visitors/patterns.js';

export class MimoToJsConverter extends BaseConverter {
    constructor() {
        super();
        this.scopeStack = [new Set()];
        this.moduleAliases = new Map();
        this._matchCounter = 0;
        this._lambdaCounter = 0;
    }

    // -------------------------------------------------------------------------
    // Entry point
    // -------------------------------------------------------------------------

    convert(ast) {
        this.output = `import { mimo } from './mimo_runtime.js';\n\n`;
        this.visitNode(ast);
        return this.output;
    }

    // -------------------------------------------------------------------------
    // Scope helpers
    // -------------------------------------------------------------------------

    enterScope() {
        this.scopeStack.push(new Set());
    }

    exitScope() {
        this.scopeStack.pop();
    }

    declareVariable(name) {
        this.scopeStack[this.scopeStack.length - 1].add(name);
    }

    isVariableDeclared(name) {
        for (let i = this.scopeStack.length - 1; i >= 0; i--) {
            if (this.scopeStack[i].has(name)) return true;
        }
        return false;
    }

    // -------------------------------------------------------------------------
    // Overrides
    // -------------------------------------------------------------------------

    onUndefinedVisitor(node) {
        console.warn(`[JS Converter] No visitor for AST node type: ${node.type}`);
    }

    /** JS blocks don't need `pass`, so just use the base implementation. */
    visitBlock(statements) {
        this.indent();
        let prev = null;
        for (const stmt of statements || []) {
            this.emitLineGap(stmt, prev);
            this.visitNode(stmt);
            prev = stmt;
        }
        this.dedent();
    }

    emitSpread(node) {
        this.write('...');
        this.visitNode(node.argument);
    }

    escapeForTemplateLiteral(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\${/g, '\\${');
    }

    // -------------------------------------------------------------------------
    // Callee helper — routes built-ins through mimo.xxx
    // -------------------------------------------------------------------------

    visitCallee(calleeNode) {
        switch (calleeNode.type) {
            case 'Identifier':
                if (this.isCoreBuiltin(calleeNode.name)) {
                    this.write(`mimo.${calleeNode.name}`);
                } else {
                    this.visitNode(calleeNode);
                }
                break;
            default:
                this.visitNode(calleeNode);
                break;
        }
    }

    // -------------------------------------------------------------------------
    // Program
    // -------------------------------------------------------------------------

    visitProgram(node) {
        let prev = null;
        for (const stmt of node.body) {
            this.emitLineGap(stmt, prev);
            this.visitNode(stmt);
            prev = stmt;
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /** Collect all variable names from a destructuring pattern. */
    _collectPatternVars(pattern) {
        if (!pattern) return [];
        if (pattern.type === 'ArrayPattern') {
            return pattern.elements.map((e) => e.name);
        }
        if (pattern.type === 'ObjectPattern') {
            return pattern.properties.map((p) => p.name);
        }
        return [];
    }

    /**
     * Render an expression node to a string without writing to output.
     * Used for default parameter values and decorator args.
     */
    _exprToString(node) {
        if (!node) return 'undefined';
        const savedOutput = this.output;
        const savedIndent = this.currentIndent;
        this.output = '';
        this.currentIndent = '';
        this.visitNode(node);
        const result = this.output;
        this.output = savedOutput;
        this.currentIndent = savedIndent;
        return result;
    }
}

// Mix in visitor methods from sub-modules
Object.assign(MimoToJsConverter.prototype, statementVisitors, expressionVisitors, patternVisitors);
