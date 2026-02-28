/**
 * Expression visitors for the Mimo → Python converter.
 * Mixed into MimoToPyConverter via Object.assign.
 */
export const expressionVisitors = {
    visitBinaryExpression(node) {
        const opMap = {
            '=': '==',
            '!=': '!=',
            '===': '==',
            '!==': '!=',
            and: 'and',
            or: 'or',
        };

        // Mimo's + operator concatenates if either operand is a string.
        // Python's + doesn't, so route through mimo.add() for type safety.
        if (node.operator === '+') {
            this.write('mimo.add(');
            this.visitNode(node.left);
            this.write(', ');
            this.visitNode(node.right);
            this.write(')');
            return;
        }

        const pyOp = opMap[node.operator] || node.operator;
        this.write('(');
        this.visitNode(node.left);
        this.write(` ${pyOp} `);
        this.visitNode(node.right);
        this.write(')');
    },

    visitUnaryExpression(node) {
        const opMap = { '!': 'not ', not: 'not ' };
        const pyOp = opMap[node.operator] || node.operator;
        this.write(`(${pyOp}`);
        this.visitNode(node.argument);
        this.write(')');
    },

    visitInlineIfExpression(node) {
        // if cond then a else b  →  (a if cond else b)
        this.write('(');
        this.visitNode(node.consequent);
        this.write(' if ');
        this.visitNode(node.condition);
        this.write(' else ');
        this.visitNode(node.alternate);
        this.write(')');
    },

    visitPipeExpression(node) {
        // value |> callee(extraArgs)  →  callee(value, extraArgs)
        // value |> if cond then f else g  →  (f if cond else g)(value)
        const callee = node.callee;
        const extraArgs = node.args || [];

        if (!callee) {
            this.visitNode(node.left);
            return;
        }

        if (callee.type === 'InlineIfExpression') {
            this.write('(');
            this.visitNode(callee.consequent);
            this.write(' if ');
            this.visitNode(callee.condition);
            this.write(' else ');
            this.visitNode(callee.alternate);
            this.write(')(');
            this.visitNode(node.left);
            this.write(')');
        } else {
            this.visitNode(callee);
            this.write('(');
            this.visitNode(node.left);
            if (extraArgs.length > 0) {
                this.write(', ');
                this.emitArgs(extraArgs);
            }
            this.write(')');
        }
    },

    visitIdentifier(node) {
        this.write(node.name);
    },

    visitLiteral(node) {
        if (node.value === null) {
            this.write('None');
        } else if (node.value === true) {
            this.write('True');
        } else if (node.value === false) {
            this.write('False');
        } else {
            this.write(JSON.stringify(node.value));
        }
    },

    visitArrayLiteral(node) {
        this.write('[');
        node.elements.forEach((el, i) => {
            if (el.type === 'SpreadElement') {
                this.emitSpread(el);
            } else {
                this.visitNode(el);
            }
            if (i < node.elements.length - 1) this.write(', ');
        });
        this.write(']');
    },

    visitObjectLiteral(node) {
        this.write('{');
        node.properties.forEach((prop, i) => {
            if (prop.type === 'SpreadElement') {
                // Python dict unpacking: **expr
                this.write('**');
                this.visitNode(prop.argument);
            } else {
                this.write(`"${prop.key}": `);
                this.visitNode(prop.value);
            }
            if (i < node.properties.length - 1) this.write(', ');
        });
        this.write('}');
    },

    visitTemplateLiteral(node) {
        this.write('f"');
        node.parts.forEach((part) => {
            if (part.type === 'Literal') {
                const escaped = String(part.value)
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"')
                    .replace(/{/g, '{{')
                    .replace(/}/g, '}}');
                this.write(escaped);
            } else {
                this.write('{');
                this.visitNode(part);
                this.write('}');
            }
        });
        this.write('"');
    },

    visitRangeLiteral(node) {
        this.write('mimo.range(');
        this.visitNode(node.start);
        this.write(', ');
        this.visitNode(node.end);
        this.write(')');
    },

    visitAnonymousFunction(node) {
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
        const paramStr = paramParts.join(', ');

        // Single-expression body with only a return → try Python lambda.
        // But if the body expression itself causes hoisting (nested anon functions),
        // we must hoist this function too (can't have sub-defs inside a lambda).
        if (
            node.body.length === 1 &&
            node.body[0].type === 'ReturnStatement'
        ) {
            const bodyExpr = node.body[0].argument;

            // Probe whether visiting the body would cause hoisting
            const savedOutput = this.output;
            const savedHoisted = this._hoistedFunctions.length;
            this.output = '';
            if (bodyExpr) {
                this.visitNode(bodyExpr);
            } else {
                this.write('None');
            }
            const bodyStr = this.output;
            this.output = savedOutput;
            const newlyHoisted = this._hoistedFunctions.splice(savedHoisted);

            if (newlyHoisted.length === 0) {
                // No sub-hoisting: safe to emit as lambda
                this.write(`(lambda ${paramStr}: ${bodyStr})`);
            } else {
                // Sub-hoisting occurred: hoist this function as a named def instead.
                const funcName = `__fn_${this._lambdaCounter++}`;
                this._hoistedFunctions.push({
                    name: funcName,
                    params: paramStr,
                    body: node.body,
                    preHoisted: newlyHoisted,
                });
                this.write(funcName);
            }
        } else {
            // Multi-statement body: hoist as a named inner function.
            const funcName = `__fn_${this._lambdaCounter++}`;
            this._hoistedFunctions.push({ name: funcName, params: paramStr, body: node.body });
            this.write(funcName);
        }
    },

    visitCallExpression(node) {
        this.visitCallee(node.callee);
        this.write('(');
        this.emitArgs(node.arguments);
        this.write(')');
    },

    visitSafeCallExpression(node) {
        // func?.(...args)  →  (func(...args) if func is not None else None)
        this.write('(');
        this.visitNode(node.callee);
        this.write('(');
        this.emitArgs(node.arguments || []);
        this.write(') if ');
        this.visitNode(node.callee);
        this.write(' is not None else None)');
    },

    visitModuleAccess(node) {
        this.write(`${node.module}.${node.property}`);
    },

    visitPropertyAccess(node) {
        // Mimo objects are Python dicts, so use mimo.get() for property access.
        this.write('mimo.get(');
        this.visitNode(node.object);
        this.write(`, "${node.property}")`);
    },

    visitSafePropertyAccess(node) {
        // obj?.prop  →  (mimo.get(obj, "prop") if obj is not None else None)
        this.write('(mimo.get(');
        this.visitNode(node.object);
        this.write(`, "${node.property}") if `);
        this.visitNode(node.object);
        this.write(' is not None else None)');
    },

    visitArrayAccess(node) {
        this.visitNode(node.object);
        this.write('[');
        this.visitNode(node.index);
        this.write(']');
    },

    visitSafeArrayAccess(node) {
        // arr?.[i]  →  (mimo.get(arr, i) if arr is not None else None)
        this.write('(mimo.get(');
        this.visitNode(node.object);
        this.write(', ');
        this.visitNode(node.index);
        this.write(') if ');
        this.visitNode(node.object);
        this.write(' is not None else None)');
    },
};
