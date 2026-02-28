/**
 * Statement visitors for the Mimo → JavaScript converter.
 * Mixed into MimoToJsConverter via Object.assign.
 */
export const statementVisitors = {
    visitShowStatement(node) {
        this.write(`${this.currentIndent}mimo.show(`);
        this.visitNode(node.expression);
        this.write(');\n');
    },

    visitVariableDeclaration(node) {
        let keyword = 'let';
        if (node.kind === 'const') keyword = 'const';
        // Mimo's `set` is mutable and function-scoped (not block-scoped).
        // Use `var` to match this: declared once with `var`, subsequent uses are bare assignments.
        if (node.kind === 'set') keyword = 'var';

        let prefix;
        if (this.isVariableDeclared(node.identifier)) {
            prefix = '';
        } else {
            prefix = node.isExported ? `export ${keyword} ` : `${keyword} `;
            this.declareVariable(node.identifier);
        }

        this.write(`${this.currentIndent}${prefix}${node.identifier} = `);
        this.visitNode(node.value);
        this.write(';\n');
    },

    visitFunctionDeclaration(node) {
        this.declareVariable(node.name);
        const exportPrefix = node.isExported ? 'export ' : '';

        // Handle decorators (bottom-up application order)
        const decorators = node.decorators || [];

        this.enterScope();

        // Build parameter list with defaults and rest params
        const defaults = node.defaults || {};
        const paramParts = (node.params || []).map((p) => {
            this.declareVariable(p.name);
            const defaultNode = defaults[p.name];
            if (defaultNode !== undefined && defaultNode !== null) {
                return `${p.name} = ${this._exprToString(defaultNode)}`;
            }
            return p.name;
        });
        if (node.restParam) {
            this.declareVariable(node.restParam.name);
            paramParts.push(`...${node.restParam.name}`);
        }

        this.write(`${this.currentIndent}${exportPrefix}function ${node.name}(${paramParts.join(', ')}) {\n`);
        this.visitBlock(node.body);
        this.writeLine('}');

        this.exitScope();

        // Apply decorators: fn = decorator(fn)
        // Mimo applies decorators in reverse order (innermost/last decorator first),
        // matching Python's @decorator stacking semantics.
        for (const dec of [...decorators].reverse()) {
            const decName = typeof dec.name === 'string' ? dec.name : dec.name?.name;
            const decArgs = dec.arguments || dec.args || [];
            const decCall = decArgs.length > 0
                ? `${decName}(${decArgs.map(a => this._exprToString(a)).join(', ')})(${node.name})`
                : `${decName}(${node.name})`;
            this.writeLine(`${node.name} = ${decCall};`);
        }
    },

    visitCallStatement(node) {
        if (node.destination) {
            const destName = node.destination.name;
            const keyword = this.isVariableDeclared(destName) ? '' : 'let ';
            this.write(`${this.currentIndent}${keyword}${destName} = `);
            this.declareVariable(destName);
        } else {
            this.write(this.currentIndent);
        }

        this.visitCallee(node.callee);
        this.write('(');
        this.emitArgs(node.arguments);
        this.write(');\n');
    },

    visitReturnStatement(node) {
        this.write(`${this.currentIndent}return`);
        if (node.argument) {
            this.write(' ');
            this.visitNode(node.argument);
        }
        this.write(';\n');
    },

    visitIfStatement(node) {
        this.write(`${this.currentIndent}if (`);
        this.visitNode(node.condition);
        this.write(') {\n');
        this.visitBlock(node.consequent);
        if (node.alternate) {
            this.write(`${this.currentIndent}} else `);
            if (node.alternate.type === 'IfStatement') {
                this.visitNode(node.alternate);
            } else {
                this.write('{\n');
                this.visitBlock(node.alternate);
                this.writeLine('}');
            }
        } else {
            this.writeLine('}');
        }
    },

    visitGuardStatement(node) {
        // guard cond else ... end  →  if (!cond) { <alternate-block> }
        this.write(`${this.currentIndent}if (!(`);
        this.visitNode(node.condition);
        this.write(')) {\n');
        this.visitBlock(node.alternate || node.elseBlock || []);
        this.writeLine('}');
    },

    visitWhileStatement(node) {
        this.write(`${this.currentIndent}while (`);
        this.visitNode(node.condition);
        this.write(') {\n');
        this.visitBlock(node.body);
        this.writeLine('}');
    },

    visitForStatement(node) {
        this.write(`${this.currentIndent}for (const ${node.variable.name} of `);
        this.visitNode(node.iterable);
        this.write(') {\n');
        this.visitBlock(node.body);
        this.writeLine('}');
    },

    visitLoopStatement(node) {
        if (node.label) this.writeLine(`${node.label}:`);
        this.writeLine('while (true) {');
        this.visitBlock(node.body);
        this.writeLine('}');
    },

    visitLabeledStatement(node) {
        this.writeLine(`${node.label}:`);
        this.visitNode(node.statement);
    },

    visitBreakStatement(node) {
        this.write(`${this.currentIndent}break`);
        if (node.label) this.write(` ${node.label}`);
        this.write(';\n');
    },

    visitContinueStatement(node) {
        this.write(`${this.currentIndent}continue`);
        if (node.label) this.write(` ${node.label}`);
        this.write(';\n');
    },

    visitTryStatement(node) {
        this.writeLine('try {');
        this.visitBlock(node.tryBlock);
        if (node.catchBlock) {
            const errName = node.catchVar?.name || '_err';
            this.write(`${this.currentIndent}} catch (${errName}) {\n`);
            this.visitBlock(node.catchBlock);
        }
        this.writeLine('}');
    },

    visitThrowStatement(node) {
        this.write(`${this.currentIndent}throw `);
        this.visitNode(node.argument);
        this.write(';\n');
    },

    visitImportStatement(node) {
        this.moduleAliases.set(node.alias, node.path);
        if (this.isStdlibModule(node.path)) {
            this.writeLine(`const ${node.alias} = mimo.${node.path};`);
        } else {
            const importPath = node.path.endsWith('.mimo')
                ? node.path.replace('.mimo', '.js')
                : `${node.path}.js`;
            this.writeLine(`import * as ${node.alias} from './${importPath}';`);
        }
    },

    visitDestructuringAssignment(node) {
        const patternVars = this._collectPatternVars(node.pattern);
        const isReassignment = patternVars.some((v) => this.isVariableDeclared(v));

        this.write(this.currentIndent);

        if (isReassignment) {
            if (node.pattern.type === 'ObjectPattern') this.write('(');
        } else {
            this.write('let ');
        }

        this.visitNode(node.pattern);
        this.write(' = ');
        this.visitNode(node.expression);

        if (isReassignment && node.pattern.type === 'ObjectPattern') this.write(')');
        this.write(';\n');

        patternVars.forEach((v) => this.declareVariable(v));
    },

    visitPropertyAssignment(node) {
        this.write(this.currentIndent);
        this.visitNode(node.object);
        this.write(`.${node.property} = `);
        this.visitNode(node.value);
        this.write(';\n');
    },

    visitBracketAssignment(node) {
        this.write(this.currentIndent);
        this.visitNode(node.object);
        this.write('[');
        this.visitNode(node.index);
        this.write('] = ');
        this.visitNode(node.value);
        this.write(';\n');
    },
};
