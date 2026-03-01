// tools/lint/Linter.js

// Import all rules from the rules directory.
// New rules must be added here manually (keeps bundler compatibility).
import { noUnusedVars }    from './rules/no-unused-vars.js';
import { preferConst }     from './rules/prefer-const.js';
import { noMagicNumbers }  from './rules/no-magic-numbers.js';
import { noEmptyFunction } from './rules/no-empty-function.js';
import { maxDepth }        from './rules/max-depth.js';
import { noShadow }        from './rules/no-shadow.js';
import { consistentReturn } from './rules/consistent-return.js';

/**
 * Central registry of all available lint rules.
 *
 * Keys are rule IDs (used in config and CLI flags).
 * Values are rule modules that implement { meta, create(context) }.
 *
 * To add a new rule:
 *   1. Create tools/lint/rules/<rule-id>.js
 *   2. Add an import above
 *   3. Add an entry here
 */
export const RULES = {
    'no-unused-vars':    noUnusedVars,
    'prefer-const':      preferConst,
    'no-magic-numbers':  noMagicNumbers,
    'no-empty-function': noEmptyFunction,
    'max-depth':         maxDepth,
    'no-shadow':         noShadow,
    'consistent-return': consistentReturn,
};

// ---------------------------------------------------------------------------
// Scope model
// ---------------------------------------------------------------------------

class LinterScope {
    constructor(parent) {
        this.parent = parent;
        this.children = [];
        /** @type {Map<string, { name, kind, node, used, reassigned, isExported }>} */
        this.variables = new Map();
        if (parent) parent.children.push(this);
    }

    declare(name, info) {
        this.variables.set(name, { name, ...info, used: false, reassigned: false });
    }

    markAsUsed(name) {
        if (this.variables.has(name)) {
            this.variables.get(name).used = true;
        } else if (this.parent) {
            this.parent.markAsUsed(name);
        }
    }

    markAsReassigned(name) {
        if (this.variables.has(name)) {
            this.variables.get(name).reassigned = true;
        } else if (this.parent) {
            this.parent.markAsReassigned(name);
        }
    }

    resolveVariable(name) {
        if (this.variables.has(name)) return this.variables.get(name);
        return this.parent ? this.parent.resolveVariable(name) : null;
    }

    /** Find which scope actually owns the binding for `name` (not inherited). */
    owningScope(name) {
        if (this.variables.has(name)) return this;
        return this.parent ? this.parent.owningScope(name) : null;
    }

    getUnusedVariables() {
        let unused = [];
        for (const info of this.variables.values()) {
            if (!info.used && !info.isExported) unused.push(info);
        }
        for (const child of this.children) {
            unused = unused.concat(child.getUnusedVariables());
        }
        return unused;
    }

    getUnmutatedLets() {
        let unmutated = Array.from(this.variables.values())
            .filter(info => info.kind === 'let' && !info.reassigned);
        for (const child of this.children) {
            unmutated = unmutated.concat(child.getUnmutatedLets());
        }
        return unmutated;
    }
}

class LinterScopeTracker {
    constructor() {
        this.globalScope = new LinterScope(null);
        this.currentScope = this.globalScope;
        /** Nesting depth of block-creating nodes (for max-depth rule). */
        this.currentDepth = 0;
    }

    enterNode(node, parent) {
        // ------------------------------------------------------------------
        // Scope creation
        // ------------------------------------------------------------------
        const createsScope =
            node.type === 'FunctionDeclaration' ||
            node.type === 'AnonymousFunction';

        const createsBlockScope =
            node.type === 'ForStatement' ||
            node.type === 'WhileStatement' ||
            node.type === 'LoopStatement' ||
            node.type === 'IfStatement' ||
            node.type === 'MatchStatement' ||
            node.type === 'CaseClause' ||
            node.type === 'TryStatement';

        if (createsScope || createsBlockScope) {
            this.currentScope = new LinterScope(this.currentScope);
        }

        if (createsScope) {
            // Declare parameters in the new function scope
            (node.params || []).forEach(p =>
                this.currentScope.declare(p.name, { kind: 'parameter', node: p })
            );
            if (node.restParam) {
                this.currentScope.declare(node.restParam.name, { kind: 'parameter', node: node.restParam });
            }
        }

        if (createsBlockScope) {
            this.currentDepth++;
        }

        // ------------------------------------------------------------------
        // Declaration registration
        // ------------------------------------------------------------------
        if (node.type === 'VariableDeclaration' && typeof node.identifier === 'string') {
            if (node.kind === 'set') {
                const existing = this.currentScope.resolveVariable(node.identifier);
                if (existing) {
                    this.currentScope.markAsReassigned(node.identifier);
                } else {
                    this.currentScope.declare(node.identifier, {
                        kind: node.kind,
                        node,
                        isExported: node.isExported,
                    });
                }
            } else {
                this.currentScope.declare(node.identifier, {
                    kind: node.kind,
                    node,
                    isExported: node.isExported,
                });
            }
        }

        if (node.type === 'FunctionDeclaration') {
            // Function name is declared in the *parent* scope
            this.currentScope.parent.declare(node.name, {
                kind: 'function',
                node,
                isExported: node.isExported,
            });
        }

        if (node.type === 'DestructuringAssignment') {
            if (node.pattern.type === 'ArrayPattern') {
                node.pattern.elements.forEach(id =>
                    this.currentScope.declare(id.name, { kind: 'let', node: id })
                );
            } else if (node.pattern.type === 'ObjectPattern') {
                node.pattern.properties.forEach(id =>
                    this.currentScope.declare(id.name, { kind: 'let', node: id })
                );
            }
        }

        // ------------------------------------------------------------------
        // Usage tracking
        // ------------------------------------------------------------------
        if (node.type === 'Identifier') {
            const isDeclarationSite =
                (parent?.type === 'VariableDeclaration' && parent.identifier === node.name) ||
                (parent?.type === 'FunctionDeclaration' && parent.name === node.name) ||
                (parent?.type === 'FunctionDeclaration' && parent.params?.includes(node)) ||
                (parent?.type === 'AnonymousFunction' && parent.params?.includes(node)) ||
                (parent?.type === 'FunctionDeclaration' && parent.restParam === node) ||
                (parent?.type === 'AnonymousFunction' && parent.restParam === node) ||
                (parent?.type === 'CallStatement' && parent.destination === node);

            if (!isDeclarationSite) {
                this.currentScope.markAsUsed(node.name);
            }
        }

        // A `set` that targets an existing variable is also a reassignment
        if (node.type === 'VariableDeclaration' && node.kind === 'set' && typeof node.identifier === 'string') {
            const local = this.currentScope.variables.get(node.identifier);
            if (!local || local.node !== node) {
                this.currentScope.markAsReassigned(node.identifier);
            }
        }
    }

    exitNode(node) {
        const createsScope =
            node.type === 'FunctionDeclaration' ||
            node.type === 'AnonymousFunction';

        const createsBlockScope =
            node.type === 'ForStatement' ||
            node.type === 'WhileStatement' ||
            node.type === 'LoopStatement' ||
            node.type === 'IfStatement' ||
            node.type === 'MatchStatement' ||
            node.type === 'CaseClause' ||
            node.type === 'TryStatement';

        if ((createsScope || createsBlockScope) && this.currentScope.parent) {
            this.currentScope = this.currentScope.parent;
        }

        if (createsBlockScope) {
            this.currentDepth--;
        }
    }

    /** Returns the tracker itself so rules can call any public method. */
    getScope()             { return this; }
    getUnusedVariables()   { return this.globalScope.getUnusedVariables(); }
    getUnmutatedLets()     { return this.globalScope.getUnmutatedLets(); }
    getCurrentScope()      { return this.currentScope; }
    getCurrentDepth()      { return this.currentDepth; }
}

// ---------------------------------------------------------------------------
// Linter
// ---------------------------------------------------------------------------

export class Linter {
    /**
     * @param {Object} options
     * @param {Object} options.rules  - Map of ruleId → true | false | { severity?, ...options }
     *   - `true`  : enable with defaults
     *   - `false` : disable
     *   - object  : enable with per-rule options; may include `severity: 'error'|'warning'`
     */
    constructor(options = {}) {
        this.messages  = [];
        this.ancestry  = [];
        this.ruleConfig = options.rules || {};
    }

    verify(ast, sourceCode, filePath) {
        this.messages = [];
        this.ancestry = [];

        const scopeTracker  = new LinterScopeTracker();
        const ruleListeners = this.initializeRules(scopeTracker);

        this.traverse(ast, null, ruleListeners, scopeTracker);
        this.triggerExitListeners(ast, ruleListeners);

        // Sort messages by line then column
        this.messages.sort((a, b) => a.line - b.line || a.column - b.column);

        return this.messages;
    }

    // -------------------------------------------------------------------------
    // Rule initialisation
    // -------------------------------------------------------------------------

    /**
     * Resolve the effective config entry for a rule.
     * Returns `null` if the rule is disabled.
     * Returns `{ severity, options }` if enabled.
     */
    _resolveRuleConfig(ruleId, ruleMeta) {
        const entry = this.ruleConfig[ruleId];

        // Explicitly disabled
        if (entry === false) return null;

        // Enabled with defaults
        if (entry === true || entry === undefined) {
            const defaultSeverity = (ruleMeta?.defaultSeverity) || 'warning';
            return { severity: defaultSeverity, options: {} };
        }

        // Object config: { severity?, ...options }
        if (typeof entry === 'object') {
            const { severity, ...options } = entry;
            const defaultSeverity = (ruleMeta?.defaultSeverity) || 'warning';
            return { severity: severity || defaultSeverity, options };
        }

        return null;
    }

    initializeRules(scopeTracker) {
        const listeners = {};

        for (const ruleId in RULES) {
            const ruleModule = RULES[ruleId];
            const resolved   = this._resolveRuleConfig(ruleId, ruleModule.meta);

            if (!resolved) continue; // disabled

            const context = {
                getScope:   () => scopeTracker,
                getParent:  () => this.ancestry[this.ancestry.length - 2] || null,
                options:    resolved.options,
                report: (descriptor) => this.report({
                    ...descriptor,
                    ruleId,
                    severity: descriptor.severity || resolved.severity,
                }),
            };

            const ruleListeners = ruleModule.create(context);

            for (const event in ruleListeners) {
                if (!listeners[event]) listeners[event] = [];
                listeners[event].push(ruleListeners[event]);
            }
        }

        return listeners;
    }

    // -------------------------------------------------------------------------
    // Reporting
    // -------------------------------------------------------------------------

    report(descriptor) {
        const { node, message, ruleId, severity = 'warning' } = descriptor;
        this.messages.push({
            ruleId,
            message,
            severity,
            line:      node.line,
            column:    node.column,
            endColumn: node.column + (node.length || 1),
        });
    }

    // -------------------------------------------------------------------------
    // Traversal
    // -------------------------------------------------------------------------

    traverse(node, parent, listeners, scope) {
        if (!node || typeof node !== 'object' || !node.type) return;

        this.ancestry.push(node);
        scope.enterNode(node, parent);

        // Fire entry listeners for this node type
        (listeners[node.type] || []).forEach(fn => fn(node));

        // Recurse into children
        for (const key in node) {
            if (key === 'parent') continue;
            const child = node[key];
            if (Array.isArray(child)) {
                child.forEach(item => this.traverse(item, node, listeners, scope));
            } else if (child && typeof child === 'object' && child.type) {
                this.traverse(child, node, listeners, scope);
            }
        }

        // Fire exit listeners: "NodeType:exit"
        (listeners[`${node.type}:exit`] || []).forEach(fn => fn(node));

        scope.exitNode(node);
        this.ancestry.pop();
    }

    triggerExitListeners(programNode, listeners) {
        (listeners['Program_exit'] || []).forEach(fn => fn(programNode));
    }
}
