// tools/lint/Linter.js

// Import all rules from the rules directory
import { noUnusedVars } from './rules/no-unused-vars.js';
import { preferConst } from './rules/prefer-const.js';
import { noMagicNumbers } from './rules/no-magic-numbers.js';


// A map of all available rules
const rules = {
    'no-unused-vars': noUnusedVars,
    'prefer-const': preferConst,
    'no-magic-numbers': noMagicNumbers,
};

// --- LinterScope and LinterScopeTracker Classes (with unused param logic) ---

class LinterScope {
    constructor(parent) {
        this.parent = parent;
        this.variables = new Map(); // name -> { name, kind, node, used, reassigned, isExported }
        this.children = [];
        if (parent) parent.children.push(this);
    }
    declare(name, info) {
        this.variables.set(name, { name, ...info, used: false, reassigned: false });
    }
    markAsUsed(name) {
        if (this.variables.has(name)) this.variables.get(name).used = true;
        else if (this.parent) this.parent.markAsUsed(name);
    }
    markAsReassigned(name) {
        if (this.variables.has(name)) this.variables.get(name).reassigned = true;
        else if (this.parent) this.parent.markAsReassigned(name);
    }
    getUnusedVariables() {
        let unused = [];
        for (const [name, info] of this.variables.entries()) {
            if (!info.used && !info.isExported) {
                unused.push(info);
            }
        }
        for (const child of this.children) {
            unused = unused.concat(child.getUnusedVariables());
        }
        return unused;
    }
    getUnmutatedLets() {
        let unmutated = Array.from(this.variables.values()).filter(info => info.kind === 'let' && !info.reassigned);
        this.children.forEach(child => { unmutated = unmutated.concat(child.getUnmutatedLets()); });
        return unmutated;
    }
}

class LinterScopeTracker {
    constructor() {
        this.globalScope = new LinterScope(null);
        this.currentScope = this.globalScope;
    }

    enterNode(node, parent) { // Now accepts the parent node
        // --- Scope Creation ---
        if (node.type === 'FunctionDeclaration' || node.type === 'AnonymousFunction') {
            this.currentScope = new LinterScope(this.currentScope);
            // Declare all parameters in the new function scope
            node.params.forEach(paramNode => {
                this.currentScope.declare(paramNode.name, { kind: 'parameter', node: paramNode });
            });
            if (node.restParam) {
                this.currentScope.declare(node.restParam.name, { kind: 'parameter', node: node.restParam });
            }
        }
        else if (node.type === 'ForStatement' || node.type === 'WhileStatement' || node.type === 'IfStatement' || node.type === 'MatchStatement' || node.type === 'CaseClause') {
            this.currentScope = new LinterScope(this.currentScope);
        }

        // --- Declaration Registration ---
        if (node.type === 'VariableDeclaration') {
            this.currentScope.declare(node.identifier, { kind: node.kind, node, isExported: node.isExported });
        }
        if (node.type === 'FunctionDeclaration') {
            this.currentScope.parent.declare(node.name, { kind: 'function', node, isExported: node.isExported });
        }
        if (node.type === 'DestructuringAssignment') {
            if (node.pattern.type === 'ArrayPattern') node.pattern.elements.forEach(id => this.currentScope.declare(id.name, { kind: 'let', node: id }));
            else if (node.pattern.type === 'ObjectPattern') node.pattern.properties.forEach(id => this.currentScope.declare(id.name, { kind: 'let', node: id }));
        }

        if (node.type === 'Identifier') {
            const isDeclarationSite =
                (parent.type === 'VariableDeclaration' && parent.identifier === node.name) ||
                (parent.type === 'FunctionDeclaration' && parent.name === node.name) ||
                (parent.type === 'FunctionDeclaration' && parent.params.includes(node)) ||
                (parent.type === 'AnonymousFunction' && parent.params.includes(node)) ||
                (parent.type === 'FunctionDeclaration' && parent.restParam === node) ||
                (parent.type === 'AnonymousFunction' && parent.restParam === node) ||
                (parent.type === 'CallStatement' && parent.destination === node);

            if (!isDeclarationSite) {
                this.currentScope.markAsUsed(node.name);
            }
        }

        if (node.type === 'VariableDeclaration' && node.kind === 'set') {
            this.currentScope.markAsReassigned(node.identifier);
        }
    }
    exitNode(node) {
        if (this.currentScope.parent && (node.type === 'FunctionDeclaration' || node.type === 'AnonymousFunction' || node.type === 'ForStatement' || node.type === 'WhileStatement' || node.type === 'IfStatement' || node.type === 'MatchStatement' || node.type === 'CaseClause')) {
            this.currentScope = this.currentScope.parent;
        }
    }
    getScope() { return this; } // Helper for context object
    getUnusedVariables() { return this.globalScope.getUnusedVariables(); }
    getUnmutatedLets() { return this.globalScope.getUnmutatedLets(); }
}


// --- Linter Class ---

export class Linter {
    constructor() {
        this.messages = [];
        this.ancestry = [];
    }

    verify(ast, sourceCode, filePath) {
        this.messages = [];
        this.ancestry = [];

        const scopeTracker = new LinterScopeTracker();
        const ruleListeners = this.initializeRules(scopeTracker);

        this.traverse(ast, null, ruleListeners, scopeTracker);
        this.triggerExitListeners(ast, ruleListeners);

        return this.messages;
    }

    initializeRules(scopeTracker) {
        const baseContext = {
            getScope: () => scopeTracker,
            // The current node is at the end of ancestry; parent is one level up.
            getParent: () => this.ancestry[this.ancestry.length - 2] || null,
        };
        const listeners = {};
        for (const ruleId in rules) {
            const context = {
                ...baseContext,
                report: (descriptor) => this.report({ ...descriptor, ruleId }),
            };
            const ruleModule = rules[ruleId].create(context);
            for (const nodeType in ruleModule) {
                if (!listeners[nodeType]) listeners[nodeType] = [];
                listeners[nodeType].push(ruleModule[nodeType]);
            }
        }
        return listeners;
    }

    report(descriptor) {
        const { node, message, ruleId } = descriptor;
        this.messages.push({ ruleId, message, line: node.line, column: node.column, endColumn: node.column + (node.length || 1) });
    }

    traverse(node, parent, listeners, scope) {
        if (!node || !node.type) return;

        // Track ancestry for reporting
        this.ancestry.push(node);

        // Pass the parent node to the scope tracker
        scope.enterNode(node, parent);

        (listeners[node.type] || []).forEach(listener => listener(node));
        for (const key in node) {
            if (key === 'parent') continue;
            const child = node[key];
            if (Array.isArray(child)) child.forEach(item => this.traverse(item, node, listeners, scope));
            else if (typeof child === 'object' && child !== null) this.traverse(child, node, listeners, scope);
        }
        scope.exitNode(node);

        // Remove the current node from ancestry after processing
        this.ancestry.pop();
    }

    triggerExitListeners(programNode, listeners) {
        (listeners['Program_exit'] || []).forEach(listener => listener(programNode));
    }
}
