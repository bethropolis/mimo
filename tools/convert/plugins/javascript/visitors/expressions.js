/**
 * Expression visitors for the Mimo → JavaScript converter.
 * Mixed into MimoToJsConverter via Object.assign.
 */
export const expressionVisitors = {
    visitBinaryExpression(node) {
        const opMap = { '=': '===', '!=': '!==', '!': '!==', and: '&&', or: '||' };
        const jsOp = opMap[node.operator] || node.operator;
        this.write('(');
        this.visitNode(node.left);
        this.write(` ${jsOp} `);
        this.visitNode(node.right);
        this.write(')');
    },

    visitUnaryExpression(node) {
        const opMap = { not: '!' };
        const jsOp = opMap[node.operator] || node.operator;
        this.write(`(${jsOp}`);
        this.visitNode(node.argument);
        this.write(')');
    },

    visitInlineIfExpression(node) {
        // if cond then a else b  →  (cond ? a : b)
        this.write('(');
        this.visitNode(node.condition);
        this.write(' ? ');
        this.visitNode(node.consequent);
        this.write(' : ');
        this.visitNode(node.alternate);
        this.write(')');
    },

    visitPipeExpression(node) {
        // value |> callee(extraArgs)  →  callee(value, extraArgs)
        // value |> if cond then f else g  →  (cond ? f : g)(value)
        const callee = node.callee;
        const extraArgs = node.args || [];

        if (!callee) {
            this.visitNode(node.left);
            return;
        }

        if (callee.type === 'InlineIfExpression') {
            this.write('(');
            this.visitNode(callee.condition);
            this.write(' ? ');
            this.visitNode(callee.consequent);
            this.write(' : ');
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
        this.write(JSON.stringify(node.value));
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
        this.write('({');
        node.properties.forEach((prop, i) => {
            if (prop.type === 'SpreadElement') {
                this.write('...');
                this.visitNode(prop.argument);
            } else {
                this.write(`${JSON.stringify(prop.key)}: `);
                this.visitNode(prop.value);
            }
            if (i < node.properties.length - 1) this.write(', ');
        });
        this.write('})');
    },

    visitTemplateLiteral(node) {
        this.write('`');
        node.parts.forEach((part) => {
            if (part.type === 'Literal') {
                this.write(this.escapeForTemplateLiteral(String(part.value)));
            } else {
                this.write('${');
                this.visitNode(part);
                this.write('}');
            }
        });
        this.write('`');
    },

    visitRangeLiteral(node) {
        this.write('mimo.range(');
        this.visitNode(node.start);
        this.write(', ');
        this.visitNode(node.end);
        this.write(')');
    },

    visitAnonymousFunction(node) {
        this.enterScope();

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

        this.write(`(${paramParts.join(', ')}) => {\n`);
        this.visitBlock(node.body);
        this.write(`${this.currentIndent}}`);

        this.exitScope();
    },

    visitCallExpression(node) {
        this.visitCallee(node.callee);
        this.write('(');
        this.emitArgs(node.arguments);
        this.write(')');
    },

    visitSafeCallExpression(node) {
        // func?.(...args) — wrap in ?? null to match Mimo semantics (undefined → null)
        this.write('(');
        this.visitNode(node.callee);
        this.write('?.(');
        this.emitArgs(node.arguments || []);
        this.write(') ?? null)');
    },

    visitModuleAccess(node) {
        this.write(`${node.module}.${node.property}`);
    },

    visitPropertyAccess(node) {
        this.visitNode(node.object);
        this.write(`.${node.property}`);
    },

    visitSafePropertyAccess(node) {
        // Wrap in ?? null to match Mimo semantics (undefined → null)
        this.write('(');
        this.visitNode(node.object);
        this.write(`?.${node.property} ?? null)`);
    },

    visitArrayAccess(node) {
        this.visitNode(node.object);
        this.write('[');
        this.visitNode(node.index);
        this.write(']');
    },

    visitSafeArrayAccess(node) {
        // arr?.[index] — wrap in ?? null to match Mimo semantics (undefined → null)
        this.write('(');
        this.visitNode(node.object);
        this.write('?.[');
        this.visitNode(node.index);
        this.write('] ?? null)');
    },
};
