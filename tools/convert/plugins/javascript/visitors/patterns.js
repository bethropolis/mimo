/**
 * Pattern matching visitors for the Mimo → JavaScript converter.
 * Mixed into MimoToJsConverter via Object.assign.
 */
export const patternVisitors = {
    visitArrayPattern(node) {
        this.write(`[${node.elements.map((e) => e.name).join(', ')}]`);
    },

    visitObjectPattern(node) {
        this.write(`{ ${node.properties.map((p) => p.name).join(', ')} }`);
    },

    visitDecorator(_node) {
        // Decorators are handled inside visitFunctionDeclaration.
    },

    visitMatchStatement(node) {
        const tempVar = `__match_${this._matchCounter++}`;
        this.write(`${this.currentIndent}const ${tempVar} = `);
        this.visitNode(node.discriminant);
        this.write(';\n');
        this.writeLine(`switch (true) {`);
        this.indent();
        node.cases.forEach((caseNode) => this._visitCaseClause(caseNode, tempVar));
        this.dedent();
        this.writeLine('}');
    },

    _visitCaseClause(node, matchVar) {
        if (!node.pattern) {
            // default case
            this.writeLine('default: {');
        } else {
            this.write(`${this.currentIndent}case (`);
            this._emitMatchCondition(node.pattern, matchVar);
            // Handle `when` guard
            if (node.guard) {
                this.write(' && (');
                this._emitMatchBindingsInline(node.pattern, matchVar);
                this.visitNode(node.guard);
                this.write(')');
            }
            this.write('): {\n');
            this.indent();
            this._emitMatchBindings(node.pattern, matchVar);
            this.dedent();
        }
        this.visitBlock(node.consequent);
        this.writeLine('break;');
        this.writeLine('}');
    },

    _emitMatchCondition(pattern, matchVar) {
        if (!pattern) { this.write('true'); return; }
        switch (pattern.type) {
            case 'Literal':
                this.write(`mimo.eq(${matchVar}, `);
                this.visitNode(pattern);
                this.write(')');
                break;
            case 'Identifier':
                this.write('true');
                break;
            case 'ArrayPattern':
                this.write(`Array.isArray(${matchVar}) && ${matchVar}.length === ${pattern.elements.length}`);
                pattern.elements.forEach((el, i) => {
                    this.write(' && ');
                    this._emitMatchCondition(el, `${matchVar}[${i}]`);
                });
                break;
            case 'ObjectPattern':
                this.write(`(${matchVar} !== null && typeof ${matchVar} === 'object')`);
                break;
            default:
                this.write('true');
        }
    },

    /** Emit bindings as part of a `when` guard expression (no-op; bindings run after the case label). */
    _emitMatchBindingsInline(_pattern, _matchVar) {},

    _emitMatchBindings(pattern, matchVar) {
        if (!pattern) return;
        switch (pattern.type) {
            case 'Identifier':
                this.writeLine(`const ${pattern.name} = ${matchVar};`);
                break;
            case 'ArrayPattern':
                pattern.elements.forEach((el, i) =>
                    this._emitMatchBindings(el, `${matchVar}[${i}]`)
                );
                break;
            case 'ObjectPattern':
                pattern.properties.forEach((prop) => {
                    const key = prop.key || prop.name;
                    this.writeLine(`const ${prop.name} = ${matchVar}["${key}"];`);
                });
                break;
        }
    },
};
