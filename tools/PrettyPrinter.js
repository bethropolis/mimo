// tools/PrettyPrinter.js

export class PrettyPrinter {
    constructor(options = {}) {
        this.indentation = '    '; // 4 spaces for indentation
        this.currentIndent = '';
        this.output = '';
    }

    format(ast) {
        this.visitNode(ast);
        return this.output;
    }

    indent() {
        this.currentIndent += this.indentation;
    }

    dedent() {
        this.currentIndent = this.currentIndent.slice(0, -this.indentation.length);
    }

    write(text) {
        this.output += text;
    }

    writeLine(line = '') {
        this.output += this.currentIndent + line + '\n';
    }

    // --- Main Dispatcher ---
    visitNode(node) {
        if (!node || !node.type) return;

        const visitor = this[`visit${node.type}`];
        if (visitor) {
            visitor.call(this, node);
        } else {
            console.warn(`[PrettyPrinter] No visitor for AST node type: ${node.type}`);
            this.writeLine(`// UNKNOWN NODE: ${node.type}`);
        }
    }

    visitBlock(statements) {
        this.indent();
        for (const stmt of statements) {
            this.visitNode(stmt);
        }
        this.dedent();
    }

    // --- Statement Visitors ---
    visitProgram(node) {
        for (let i = 0; i < node.body.length; i++) {
            this.visitNode(node.body[i]);
            if (i < node.body.length - 1) {
                // Add a blank line between top-level statements/blocks
                this.write('\n');
            }
        }
    }

    visitVariableDeclaration(node) {
        this.write(this.currentIndent);
        if (node.isExported) this.write('export ');
        this.write(`${node.kind} ${node.identifier} `);
        this.visitNode(node.value);
        this.write('\n');
    }

    visitDestructuringAssignment(node) {
        this.write(this.currentIndent + 'destructure ');
        // THIS IS THE FIX: The pattern is a single node now.
        this.visitNode(node.pattern);
        this.write(' from ');
        this.visitNode(node.expression);
        this.write('\n');
    }

    visitPropertyAssignment(node) {
        this.write(this.currentIndent + 'set ');
        this.visitNode(node.object);
        this.write(`.${node.property} `);
        this.visitNode(node.value);
        this.write('\n');
    }

    visitBracketAssignment(node) {
        this.write(this.currentIndent + 'set ');
        this.visitNode(node.object);
        this.write('[');
        this.visitNode(node.index);
        this.write('] ');
        this.visitNode(node.value);
        this.write('\n');
    }

    visitFunctionDeclaration(node) {
        this.write(this.currentIndent);
        if (node.isExported) this.write('export ');
        this.write(`function ${node.name}(`);
        const params = node.params.map((p) => {
            const name = typeof p === 'string' ? p : p.name;
            const defaultNode = node.defaults[name];
            if (defaultNode) {
                const tempPrinter = new PrettyPrinter();
                tempPrinter.visitNode(defaultNode);
                return `${name}: ${tempPrinter.output}`;
            }
            return name;
        });
        if (node.restParam) {
            const restName = typeof node.restParam === 'string' ? node.restParam : node.restParam.name;
            params.push(`...${restName}`);
        }
        this.write(params.join(', '));
        this.write(')\n');
        this.visitBlock(node.body);
        this.writeLine('end');
    }

    visitIfStatement(node) {
        this.write(this.currentIndent + 'if ');
        this.visitNode(node.condition);
        this.write('\n');
        this.visitBlock(node.consequent);
        if (node.alternate) {
            if (node.alternate.type === 'IfStatement') { // else if
                this.write(this.currentIndent + 'else ');
                this.visitNode(node.alternate);
            } else { // else
                this.writeLine('else');
                this.visitBlock(node.alternate);
                this.writeLine('end');
            }
        } else {
            this.writeLine('end');
        }
    }

    visitWhileStatement(node) {
        this.write(this.currentIndent + 'while ');
        this.visitNode(node.condition);
        this.write('\n');
        this.visitBlock(node.body);
        this.writeLine('end');
    }

    visitForStatement(node) {
        this.write(this.currentIndent + 'for ');
        this.visitNode(node.variable);
        this.write(' in ');
        this.visitNode(node.iterable);
        this.write('\n');
        this.visitBlock(node.body);
        this.writeLine('end');
    }

    visitLoopStatement(node) {
        if (node.label) {
            this.writeLine(`${node.label}:`);
        }
        this.writeLine('loop');
        this.visitBlock(node.body);
        this.writeLine('end');
    }

    visitLabeledStatement(node) {
        this.writeLine(`${node.label}:`);
        this.visitNode(node.statement);
    }

    visitAnonymousFunction(node) {
        this.write(`(function(`);
        const params = node.params.map((p) => {
            const name = typeof p === 'string' ? p : p.name;
            const defaultNode = node.defaults[name];
            if (defaultNode) {
                const tempPrinter = new PrettyPrinter();
                tempPrinter.visitNode(defaultNode);
                return `${name}: ${tempPrinter.output}`;
            }
            return name;
        });
        if (node.restParam) {
            const restName = typeof node.restParam === 'string' ? node.restParam : node.restParam.name;
            params.push(`...${restName}`);
        }
        this.write(params.join(', '));
        this.write(')\n');
        this.visitBlock(node.body);
        this.write(this.currentIndent + 'end)');
    }

    visitRangeLiteral(node) {
        this.visitNode(node.start);
        this.write(' .. ');
        this.visitNode(node.end);
    }

    visitSpreadElement(node) {
        this.write('...');
        this.visitNode(node.argument);
    }

    visitBreakStatement(node) {
        this.write(this.currentIndent + 'break');
        if (node.label) this.write(` ${node.label}`);
        this.write('\n');
    }

    visitContinueStatement(node) {
        this.write(this.currentIndent + 'continue');
        if (node.label) this.write(` ${node.label}`);
        this.write('\n');
    }

    visitTryStatement(node) {
        this.writeLine('try');
        this.visitBlock(node.tryBlock);
        if (node.catchBlock.length > 0) {
            this.write(this.currentIndent + 'catch');
            if (node.catchVar) {
                this.write(' ');
                this.visitNode(node.catchVar);
            }
            this.write('\n');
            this.visitBlock(node.catchBlock);
        }
        this.writeLine('end');
    }

    visitThrowStatement(node) {
        this.write(this.currentIndent + 'throw ');
        this.visitNode(node.argument);
        this.write('\n');
    }

    visitCallStatement(node) {
        this.write(this.currentIndent + 'call ');
        this.visitNode(node.callee);
        this.write('(');
        node.arguments.forEach((arg, i) => {
            this.visitNode(arg);
            if (i < node.arguments.length - 1) this.write(', ');
        });
        this.write(')');
        if (node.destination) {
            this.write(' -> ');
            this.visitNode(node.destination);
        }
        this.write('\n');
    }

    visitShowStatement(node) {
        this.write(this.currentIndent + 'show ');
        this.visitNode(node.expression);
        this.write('\n');
    }

    visitReturnStatement(node) {
        this.write(this.currentIndent + 'return');
        if (node.argument) {
            this.write(' ');
            this.visitNode(node.argument);
        }
        this.write('\n');
    }

    visitImportStatement(node) {
        this.writeLine(`import "${node.path}" as ${node.alias}`);
    }

    visitMatchStatement(node) {
        this.write(this.currentIndent + 'match ');
        this.visitNode(node.discriminant);
        this.write('\n');
        // Cases are already indented within their own blocks
        for (const caseClause of node.cases) {
            this.visitNode(caseClause);
        }
        this.writeLine('end');
    }

    visitCaseClause(node) {
        this.indent();
        this.write(this.currentIndent);
        if (node.pattern) {
            this.write('case ');
            this.visitNode(node.pattern);
        } else {
            this.write('default');
        }
        this.write(':\n');
        this.visitBlock(node.consequent);
        this.dedent();
    }

    // --- Expression Visitors ---
    // --- Expression Visitors ---
    visitBinaryExpression(node) {
        this.write(`${node.operator} `);
        this.visitNode(node.left);
        this.write(' ');
        this.visitNode(node.right);
    }

    visitUnaryExpression(node) {
        this.write(`${node.operator} `);
        this.visitNode(node.argument);
    }

    visitIdentifier(node) {
        this.write(node.name);
    }

    visitLiteral(node) {
        if (typeof node.value === 'string') {
            this.write(`"${node.value.replace(/"/g, '\\"')}"`);
        } else {
            this.write(String(node.value));
        }
    }

    visitArrayLiteral(node) {
        this.write('[');
        node.elements.forEach((el, i) => {
            if (el.type === 'SpreadElement') {
                this.write('...');
                this.visitNode(el.argument);
            } else {
                this.visitNode(el);
            }
            if (i < node.elements.length - 1) this.write(', ');
        });
        this.write(']');
    }

    visitObjectLiteral(node) {
        if (node.properties.length === 0) {
            this.write('{}');
            return;
        }
        this.write('{ ');
        node.properties.forEach((prop, i) => {
            if (prop && prop.type === 'SpreadElement') {
                this.write('...');
                this.visitNode(prop.argument);
            } else {
                this.write(`${prop.key}: `);
                this.visitNode(prop.value);
            }
            if (i < node.properties.length - 1) this.write(', ');
        });
        this.write(' }');
    }

    visitArrayPattern(node) {
        this.write('[');
        // Corrected from `variables` to `elements`
        node.elements.forEach((v, i) => {
            this.visitNode(v);
            if (i < node.elements.length - 1) this.write(', ');
        });
        this.write(']');
    }

    visitObjectPattern(node) {
        this.write('{ ');
        node.properties.forEach((p, i) => {
            this.visitNode(p);
            if (i < node.properties.length - 1) this.write(', ');
        });
        this.write(' }');
    }

    visitModuleAccess(node) {
        this.write(`${node.module}.${node.property}`);
    }

    visitPropertyAccess(node) {
        this.visitNode(node.object);
        this.write(`.${node.property}`);
    }

    visitSafePropertyAccess(node) {
        this.visitNode(node.object);
        this.write(`?.${node.property}`);
    }

    visitArrayAccess(node) {
        this.visitNode(node.object);
        this.write(`[`);
        this.visitNode(node.index);
        this.write(`]`);
    }

    visitCallExpression(node) {
        this.write('call ');
        this.visitNode(node.callee);
        this.write('(');
        node.arguments.forEach((arg, i) => {
            this.visitNode(arg);
            if (i < node.arguments.length - 1) this.write(', ');
        });
        this.write(')');
    }

    visitTemplateLiteral(node) {
        this.write('`');
        for (const part of node.parts) {
            if (part.type === 'Literal') {
                this.write(part.value);
            } else {
                this.write('${');
                this.visitNode(part);
                this.write('}');
            }
        }
        this.write('`');
    }
}