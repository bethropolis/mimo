/**
 * Mimo → Python transpiler.
 *
 * Converts a Mimo AST to Python 3 source code.
 * Extends BaseConverter for shared infrastructure; visitor methods are
 * mixed in from focused sub-modules.
 */
import { BaseConverter } from '../base_converter.js';
import { statementVisitors } from './visitors/statements.js';
import { expressionVisitors } from './visitors/expressions.js';
import { patternVisitors } from './visitors/patterns.js';

export class MimoToPyConverter extends BaseConverter {
    constructor() {
        super();
        this.moduleAliases = new Map();
        this._matchCounter = 0;
        this._lambdaCounter = 0;
        this._pendingImports = [];       // stdlib imports gathered in first pass
        this._hoistedFunctions = [];     // hoisted inner defs for multi-stmt anon functions
        this._deferredDecorators = [];   // decorator applications emitted after all function defs
        this._moduleVars = new Set();    // top-level variable names (for `global` declarations)
        this._emittingHoistedFunctions = false; // true during program-level function hoisting pass
        this._enclosingFunctionVars = []; // stack of variable sets for enclosing function scopes
    }

    // -------------------------------------------------------------------------
    // Entry point
    // -------------------------------------------------------------------------

    convert(ast) {
        // First pass: gather stdlib module imports so we can emit them at the top.
        this._collectStdlibImports(ast);

        // Second pass: collect all module-level variable names for `global` declarations.
        this._collectModuleVars(ast);

        // Build header
        this.output = `from mimo_runtime import mimo\n`;
        for (const imp of this._pendingImports) {
            this.output += `${imp}\n`;
        }
        this.output += '\n';

        this.visitNode(ast);

        // Python idiom: guard the top-level execution
        this.output += '\nif __name__ == "__main__":\n    pass\n';

        return this.output;
    }

    // -------------------------------------------------------------------------
    // AST analysis helpers (pre-passes)
    // -------------------------------------------------------------------------

    /** Collect external (non-stdlib) module imports for top-level import stmts. */
    _collectStdlibImports(node) {
        if (!node || typeof node !== 'object') return;
        if (node.type === 'ImportStatement' && !this.isStdlibModule(node.path)) {
            const modName = node.path.endsWith('.mimo')
                ? node.path.slice(0, -5)
                : node.path;
            const imp = `import ${modName} as ${node.alias}`;
            if (!this._pendingImports.includes(imp)) {
                this._pendingImports.push(imp);
            }
        }
        for (const key of Object.keys(node)) {
            const child = node[key];
            if (Array.isArray(child)) {
                child.forEach((c) => this._collectStdlibImports(c));
            } else if (child && typeof child === 'object' && child.type) {
                this._collectStdlibImports(child);
            }
        }
    }

    /**
     * Collect module-level variable names from the top-level program body.
     * These are used to emit `global` declarations inside functions that
     * assign to them (Mimo uses dynamic scoping for `set`).
     */
    _collectModuleVars(ast) {
        if (!ast || ast.type !== 'Program') return;
        for (const stmt of ast.body) {
            if (stmt.type === 'VariableDeclaration') {
                this._moduleVars.add(stmt.identifier);
            } else if (stmt.type === 'AssignmentStatement' && stmt.target?.type === 'Identifier') {
                this._moduleVars.add(stmt.target.name);
            } else if (stmt.type === 'FunctionDeclaration') {
                this._moduleVars.add(stmt.name);
            }
        }
    }

    /**
     * Collect all variable names that are assigned (set) within a block of statements.
     * Does not recurse into nested function declarations.
     */
    _collectAssignedVars(stmts, result = new Set()) {
        for (const stmt of stmts || []) {
            if (!stmt) continue;
            if (stmt.type === 'AssignmentStatement' && stmt.target?.type === 'Identifier') {
                result.add(stmt.target.name);
            } else if (stmt.type === 'VariableDeclaration') {
                result.add(stmt.identifier);
            } else if (stmt.type === 'IfStatement') {
                this._collectAssignedVars(stmt.consequent, result);
                if (Array.isArray(stmt.alternate)) this._collectAssignedVars(stmt.alternate, result);
                else if (stmt.alternate) this._collectAssignedVars([stmt.alternate], result);
            } else if (stmt.type === 'WhileStatement' || stmt.type === 'ForStatement' || stmt.type === 'LoopStatement') {
                this._collectAssignedVars(stmt.body, result);
            } else if (stmt.type === 'TryStatement') {
                this._collectAssignedVars(stmt.tryBlock, result);
                this._collectAssignedVars(stmt.catchBlock, result);
            } else if (stmt.type === 'GuardStatement') {
                this._collectAssignedVars(stmt.alternate || stmt.elseBlock, result);
            }
            // Do NOT recurse into nested FunctionDeclaration — they have their own scope
        }
        return result;
    }

    // -------------------------------------------------------------------------
    // Overrides
    // -------------------------------------------------------------------------

    onUndefinedVisitor(node) {
        console.warn(`[Python Converter] No visitor for AST node type: ${node.type}`);
    }

    /** Python blocks must not be empty — emit `pass` if empty. */
    visitBlock(statements) {
        if (!statements || statements.length === 0) {
            this.indent();
            this.writeLine('pass');
            this.dedent();
            return;
        }
        this.indent();
        let prev = null;
        statements.forEach((stmt) => {
            this.emitLineGap(stmt, prev);
            // Snapshot output length before visiting the statement.
            // Any multi-statement anonymous functions encountered during visitNode(stmt)
            // push into _hoistedFunctions. After the visit we splice their definitions
            // BEFORE the statement that referenced them.
            const outputBefore = this.output.length;
            const hoistedBefore = this._hoistedFunctions.length;

            this.visitNode(stmt);

            const newlyHoisted = this._hoistedFunctions.splice(hoistedBefore);
            if (newlyHoisted.length > 0) {
                const stmtCode = this.output.slice(outputBefore);
                this.output = this.output.slice(0, outputBefore);
                for (const hfn of newlyHoisted) {
                    this._emitHoistedFunction(hfn);
                }
                this.output += stmtCode;
            }
            prev = stmt;
        });
        this.dedent();
    }

    emitSpread(node) {
        this.write('*');
        this.visitNode(node.argument);
    }

    // -------------------------------------------------------------------------
    // Hoisting infrastructure
    // -------------------------------------------------------------------------

    /**
     * Emit a hoisted anonymous function as a named `def`.
     * Handles nonlocal declarations for closure variables and recursively
     * emits any pre-hoisted sub-functions inside the body.
     */
    _emitHoistedFunction(hfn) {
        this.writeLine(`def ${hfn.name}(${hfn.params}):`);

        // Determine which vars are local to this hoisted function
        const paramNames = new Set(
            (hfn.params ? hfn.params.split(',').map(p => p.trim().replace(/=.*$/, '').replace(/^\*/, '')) : [])
                .filter(Boolean)
        );
        const assignedInBody = this._collectAssignedVars(hfn.body);
        const funcVars = new Set([...paramNames, ...assignedInBody]);

        // Nonlocal: vars assigned in this body that live in an enclosing function scope
        const nonlocalVars = [...assignedInBody].filter(
            v => !paramNames.has(v) &&
                 !this._moduleVars.has(v) &&
                 this._enclosingFunctionVars.some(scope => scope.has(v))
        );

        // Push our vars so inner functions can detect their own nonlocals
        this._enclosingFunctionVars.push(funcVars);

        this.indent();
        if (nonlocalVars.length > 0) {
            this.writeLine(`nonlocal ${nonlocalVars.join(', ')}`);
        }
        // Emit any pre-hoisted sub-functions inside this def's body first
        if (hfn.preHoisted && hfn.preHoisted.length > 0) {
            for (const sub of hfn.preHoisted) {
                this._emitHoistedFunction(sub);
            }
        }
        // Emit body statements with hoisting support for inner anonymous functions
        if (!hfn.body || hfn.body.length === 0) {
            this.writeLine('pass');
        } else {
            for (const stmt of hfn.body) {
                const outputBefore = this.output.length;
                const hoistedBefore = this._hoistedFunctions.length;

                this.visitNode(stmt);

                const newlyHoisted = this._hoistedFunctions.splice(hoistedBefore);
                if (newlyHoisted.length > 0) {
                    const stmtCode = this.output.slice(outputBefore);
                    this.output = this.output.slice(0, outputBefore);
                    for (const innerHfn of newlyHoisted) {
                        this._emitHoistedFunction(innerHfn);
                    }
                    this.output += stmtCode;
                }
            }
        }
        this.dedent();

        this._enclosingFunctionVars.pop();
        this.writeLine();
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
        // Mimo hoists all FunctionDeclarations before executing other statements.
        // To match this, emit all function definitions first (without decorators),
        // then apply all decorators, then run the rest of the statements.
        const functions = node.body.filter(s => s.type === 'FunctionDeclaration');
        const others = node.body.filter(s => s.type !== 'FunctionDeclaration');

        // Pass 1: emit all function defs (decorator wrappers collected into _deferredDecorators)
        this._emittingHoistedFunctions = true;
        functions.forEach((stmt) => this.visitNode(stmt));
        this._emittingHoistedFunctions = false;

        // Pass 2: apply collected decorator wrappers
        if (this._deferredDecorators.length > 0) {
            for (const line of this._deferredDecorators) {
                this.writeLine(line);
            }
            this._deferredDecorators = [];
            this.writeLine();
        }

        // Pass 3: emit non-function statements (with hoisting support for inline anonymous functions)
        let prev = null;
        others.forEach((stmt) => {
            this.emitLineGap(stmt, prev);
            const outputBefore = this.output.length;
            const hoistedBefore = this._hoistedFunctions.length;

            this.visitNode(stmt);

            const newlyHoisted = this._hoistedFunctions.splice(hoistedBefore);
            if (newlyHoisted.length > 0) {
                const stmtCode = this.output.slice(outputBefore);
                this.output = this.output.slice(0, outputBefore);
                for (const hfn of newlyHoisted) {
                    this._emitHoistedFunction(hfn);
                }
                this.output += stmtCode;
            }
            prev = stmt;
        });
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Render an expression node to a string without writing to output.
     * Used for default parameter values and decorator args.
     */
    _exprToString(node) {
        if (!node) return 'None';
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
Object.assign(MimoToPyConverter.prototype, statementVisitors, expressionVisitors, patternVisitors);
