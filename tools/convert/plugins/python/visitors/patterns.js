/**
 * Pattern matching and destructuring visitors for the Mimo → Python converter.
 * Mixed into MimoToPyConverter via Object.assign.
 */
export const patternVisitors = {
    visitArrayPattern(node) {
        // Python tuple/list unpacking: a, b, c = ...
        this.write(node.elements.map((e) => e.name).join(', '));
    },

    visitObjectPattern(node) {
        // Python doesn't have object destructuring — just emit target names.
        this.write(node.properties.map((p) => p.name).join(', '));
    },

    visitDecorator(_node) {
        // Handled inside visitFunctionDeclaration
    },

    visitMatchStatement(node) {
        const tempVar = `__match_${this._matchCounter++}`;
        this.write(`${this.currentIndent}${tempVar} = `);
        this.visitNode(node.discriminant);
        this.write('\n');

        let first = true;
        for (const caseNode of node.cases) {
            this._visitCaseClause(caseNode, tempVar, first);
            first = false;
        }
    },

    _visitCaseClause(node, matchVar, isFirst) {
        if (!node.pattern) {
            // default
            this.writeLine('else:');
        } else {
            const prefix = isFirst ? 'if ' : 'elif ';
            this.write(`${this.currentIndent}${prefix}`);
            this._emitMatchCondition(node.pattern, matchVar);
            // `when` guard
            if (node.guard) {
                this.write(' and (');
                this.visitNode(node.guard);
                this.write(')');
            }
            this.write(':\n');
            this.indent();
            this._emitMatchBindings(node.pattern, matchVar);
            this.dedent();
        }
        this.visitBlock(node.consequent);
    },

    _emitMatchCondition(pattern, matchVar) {
        if (!pattern) { this.write('True'); return; }
        switch (pattern.type) {
            case 'Literal':
                this.write(`mimo.eq(${matchVar}, `);
                this.visitNode(pattern);
                this.write(')');
                break;
            case 'Identifier':
                this.write('True');
                break;
            case 'ArrayPattern':
                this.write(`isinstance(${matchVar}, list) and len(${matchVar}) == ${pattern.elements.length}`);
                pattern.elements.forEach((el, i) => {
                    this.write(' and ');
                    this._emitMatchCondition(el, `${matchVar}[${i}]`);
                });
                break;
            case 'ObjectPattern':
                this.write(`isinstance(${matchVar}, dict)`);
                break;
            default:
                this.write('True');
        }
    },

    _emitMatchBindings(pattern, matchVar) {
        if (!pattern) return;
        switch (pattern.type) {
            case 'Identifier':
                this.writeLine(`${pattern.name} = ${matchVar}`);
                break;
            case 'ArrayPattern':
                pattern.elements.forEach((el, i) =>
                    this._emitMatchBindings(el, `${matchVar}[${i}]`)
                );
                break;
            case 'ObjectPattern':
                pattern.properties.forEach((prop) => {
                    const key = prop.key || prop.name;
                    this.writeLine(`${prop.name} = ${matchVar}.get("${key}")`);
                });
                break;
        }
    },
};
