/**
 * Statement visitors for the Mimo → Python converter.
 * Mixed into MimoToPyConverter via Object.assign.
 */
export const statementVisitors = {
    visitShowStatement(node) {
        this.write(`${this.currentIndent}mimo.show(`);
        this.visitNode(node.expression);
        this.write(')\n');
    },

    visitVariableDeclaration(node) {
        this.write(`${this.currentIndent}${node.identifier} = `);
        this.visitNode(node.value);
        this.write('\n');
    },

    visitFunctionDeclaration(node) {
        const decorators = node.decorators || [];

        // Build parameter list with defaults and rest params
        const defaults = node.defaults || {};
        const paramParts = (node.params || []).map((p) => {
            const defaultNode = defaults[p.name];
            if (defaultNode !== undefined && defaultNode !== null) {
                return `${p.name}=${this._exprToString(defaultNode)}`;
            }
            return p.name;
        });
        if (node.restParam) {
            paramParts.push(`*${node.restParam.name}`);
        }

        // Collect parameters and locals to exclude from global declarations
        const paramNames = new Set((node.params || []).map(p => p.name));
        if (node.restParam) paramNames.add(node.restParam.name);

        // Find module-level vars that are assigned inside this function body
        const assignedInBody = this._collectAssignedVars(node.body);
        const globalsNeeded = [...assignedInBody].filter(
            v => this._moduleVars.has(v) && !paramNames.has(v)
        );

        this.writeLine(`def ${node.name}(${paramParts.join(', ')}):`);
        // Emit global declarations before the body
        if (globalsNeeded.length > 0) {
            this.indent();
            this.writeLine(`global ${globalsNeeded.join(', ')}`);
            this.dedent();
        }

        // Track variables declared in this function for nested closure detection
        const funcVars = new Set([...paramNames, ...this._collectAssignedVars(node.body)]);
        this._enclosingFunctionVars.push(funcVars);
        this.visitBlock(node.body);
        this._enclosingFunctionVars.pop();
        this.writeLine();

        // Apply decorators immediately after function definition.
        // When emitting hoisted functions (visitProgram pass 1), defer all decorator
        // applications so that all functions are defined before any decorator is applied.
        for (const dec of [...decorators].reverse()) {
            const decName = typeof dec.name === 'string' ? dec.name : dec.name?.name;
            const decArgs = dec.arguments || dec.args || [];
            let decLine;
            if (decArgs.length > 0) {
                const argStr = decArgs.map((a) => this._exprToString(a)).join(', ');
                decLine = `${node.name} = ${decName}(${argStr})(${node.name})`;
            } else {
                decLine = `${node.name} = ${decName}(${node.name})`;
            }
            if (this._emittingHoistedFunctions) {
                this._deferredDecorators.push(decLine);
            } else {
                this.writeLine(decLine);
            }
        }
        if (decorators.length > 0 && !this._emittingHoistedFunctions) this.writeLine();
    },

    visitCallStatement(node) {
        if (node.destination) {
            const destName = node.destination.name;
            this.write(`${this.currentIndent}${destName} = `);
        } else {
            this.write(this.currentIndent);
        }

        this.visitCallee(node.callee);
        this.write('(');
        this.emitArgs(node.arguments);
        this.write(')\n');
    },

    visitReturnStatement(node) {
        this.write(`${this.currentIndent}return`);
        if (node.argument) {
            this.write(' ');
            this.visitNode(node.argument);
        }
        this.write('\n');
    },

    visitIfStatement(node) {
        this.write(`${this.currentIndent}if `);
        this.visitNode(node.condition);
        this.write(':\n');
        this.visitBlock(node.consequent);

        if (node.alternate) {
            if (node.alternate.type === 'IfStatement') {
                // `elif` — prefix with `el` then let visitIfStatement emit `if`
                this.write(`${this.currentIndent}el`);
                this.visitNode(node.alternate);
            } else {
                this.writeLine('else:');
                this.visitBlock(node.alternate);
            }
        }
    },

    visitGuardStatement(node) {
        // guard cond else ... end  →  if not (cond): <alternate-block>
        this.write(`${this.currentIndent}if not (`);
        this.visitNode(node.condition);
        this.write('):\n');
        this.visitBlock(node.alternate || node.elseBlock || []);
    },

    visitWhileStatement(node) {
        this.write(`${this.currentIndent}while `);
        this.visitNode(node.condition);
        this.write(':\n');
        this.visitBlock(node.body);
    },

    visitForStatement(node) {
        this.write(`${this.currentIndent}for ${node.variable.name} in `);
        this.visitNode(node.iterable);
        this.write(':\n');
        this.visitBlock(node.body);
    },

    visitLoopStatement(node) {
        if (node.label) this.writeLine(`# label: ${node.label}`);
        this.writeLine('while True:');
        this.visitBlock(node.body);
    },

    visitLabeledStatement(node) {
        this.writeLine(`# label: ${node.label}`);
        this.visitNode(node.statement);
    },

    visitBreakStatement(node) {
        // Python doesn't support labeled break; emit a comment if label present
        if (node.label) this.writeLine(`# break ${node.label} (labeled break not supported in Python)`);
        this.writeLine('break');
    },

    visitContinueStatement(node) {
        if (node.label) this.writeLine(`# continue ${node.label} (labeled continue not supported in Python)`);
        this.writeLine('continue');
    },

    visitTryStatement(node) {
        this.writeLine('try:');
        this.visitBlock(node.tryBlock);
        if (node.catchBlock) {
            const errName = node.catchVar?.name || '_err';
            const tmpName = `_exc_${errName}`;
            this.writeLine(`except Exception as ${tmpName}:`);
            this.indent();
            // Coerce the exception to a string so it behaves like in Mimo/JS
            this.writeLine(`${errName} = str(${tmpName})`);
            (node.catchBlock || []).forEach((stmt) => this.visitNode(stmt));
            this.dedent();
        }
    },

    visitThrowStatement(node) {
        this.write(`${this.currentIndent}raise Exception(`);
        this.visitNode(node.argument);
        this.write(')\n');
    },

    visitImportStatement(node) {
        this.moduleAliases.set(node.alias, node.path);
        if (this.isStdlibModule(node.path)) {
            // Bind the stdlib sub-object from the mimo runtime
            this.writeLine(`${node.alias} = mimo.${node.path}`);
        } else {
            // External import was already emitted as a top-level `import` statement.
            // Just bind the alias name so the rest of the code works.
            this.writeLine(`${node.alias} = ${node.alias}`);
        }
    },

    visitDestructuringAssignment(node) {
        if (node.pattern.type === 'ObjectPattern') {
            // Python can't unpack dicts like JS, emit individual assignments
            const exprStr = this._exprToString(node.expression);
            this._emitObjectDestructuring(node.pattern, exprStr);
        } else if (node.pattern.type === 'ArrayPattern') {
            // Array pattern: emit individual index assignments to handle extra elements
            // e.g. [x, y] = arr  →  __tmp = arr; x = mimo.get(__tmp, 0); y = mimo.get(__tmp, 1)
            const elements = node.pattern.elements || [];
            if (elements.length === 0) return;
            const tmpVar = `__tmp_${this._matchCounter++}`;
            this.write(`${this.currentIndent}${tmpVar} = `);
            this.visitNode(node.expression);
            this.write('\n');
            elements.forEach((el, i) => {
                if (el && el.name) {
                    this.writeLine(`${el.name} = mimo.get(${tmpVar}, ${i})`);
                }
            });
        } else {
            this.write(this.currentIndent);
            this.visitNode(node.pattern);
            this.write(' = ');
            this.visitNode(node.expression);
            this.write('\n');
        }
    },

    visitPropertyAssignment(node) {
        this.write(this.currentIndent);
        this.visitNode(node.object);
        this.write(`["${node.property}"] = `);
        this.visitNode(node.value);
        this.write('\n');
    },

    visitBracketAssignment(node) {
        this.write(this.currentIndent);
        this.visitNode(node.object);
        this.write('[');
        this.visitNode(node.index);
        this.write('] = ');
        this.visitNode(node.value);
        this.write('\n');
    },

    /**
     * Emit a Python object destructuring assignment.
     * Python can't do `a, b = obj` for dicts, so we expand it as:
     *   a = obj.get("a")
     *   b = obj.get("b")
     */
    _emitObjectDestructuring(pattern, exprStr) {
        pattern.properties.forEach((prop) => {
            const key = prop.key || prop.name;
            this.writeLine(`${prop.name} = (${exprStr}).get("${key}")`);
        });
    },
};
