// tools/PrettyPrinter.js

export class PrettyPrinter {
    constructor(options = {}) {
        this.indentation = '    '; // 4 spaces for indentation
        this.currentIndent = '';
        this.output = '';
        this.maxInlineArrayLength = options.maxInlineArrayLength ?? 100;
        this.maxInlineObjectLength = options.maxInlineObjectLength ?? 80;
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
            const current = node.body[i];
            const next = node.body[i + 1];
            this.visitNode(current);
            if (next && this.shouldInsertBlankLine(current, next)) this.write('\n');
        }
    }

    shouldInsertBlankLine(current, next) {
        if (!current || !next) return false;

        // Keep import blocks tight, with a single separation before the next non-import.
        if (current.type === 'ImportStatement' && next.type === 'ImportStatement') return false;
        if (current.type === 'ImportStatement' && next.type !== 'ImportStatement') return true;
        if (current.type !== 'ImportStatement' && next.type === 'ImportStatement') return true;

        // Group related one-line statements without extra spacing.
        if (this.isSimpleStatement(current) && this.isSimpleStatement(next)) return false;

        // Respect explicit visual separators in source intent.
        if (this.isEmptyShowSeparator(current)) return true;

        // Separate blocks and control-flow sections for readability.
        if (this.isBlockLike(current) || this.isBlockLike(next)) return true;
        return false;
    }

    isSimpleStatement(node) {
        return [
            'VariableDeclaration',
            'DestructuringAssignment',
            'PropertyAssignment',
            'BracketAssignment',
            'CallStatement',
            'ShowStatement',
            'ReturnStatement',
            'ThrowStatement',
            'BreakStatement',
            'ContinueStatement'
        ].includes(node?.type);
    }

    isBlockLike(node) {
        return [
            'FunctionDeclaration',
            'IfStatement',
            'GuardStatement',
            'WhileStatement',
            'ForStatement',
            'LoopStatement',
            'TryStatement',
            'MatchStatement',
            'LabeledStatement'
        ].includes(node?.type);
    }

    isEmptyShowSeparator(node) {
        return node?.type === 'ShowStatement' && node.expression?.type === 'Literal' && node.expression.value === '';
    }

    estimateNodeLength(node) {
        if (!node) return 0;
        switch (node.type) {
            case 'Identifier':
                return node.name.length;
            case 'Literal':
                return typeof node.value === 'string' ? node.value.length + 2 : String(node.value).length;
            case 'PropertyAccess':
            case 'SafePropertyAccess':
                return this.estimateNodeLength(node.object) + 1 + String(node.property ?? '').length;
            case 'ArrayAccess':
            case 'SafeArrayAccess':
                return this.estimateNodeLength(node.object) + this.estimateNodeLength(node.index) + 2;
            case 'ModuleAccess':
                return String(node.module ?? '').length + 1 + String(node.property ?? '').length;
            case 'CallExpression':
                return 7 + this.estimateNodeLength(node.callee) + node.arguments.reduce((n, arg) => n + this.estimateNodeLength(arg) + 2, 0);
            case 'BinaryExpression':
                return String(node.operator ?? '').length + 2 + this.estimateNodeLength(node.left) + this.estimateNodeLength(node.right);
            case 'UnaryExpression':
                return String(node.operator ?? '').length + 1 + this.estimateNodeLength(node.argument);
            case 'ArrayLiteral':
                return 2 + node.elements.reduce((n, el) => n + this.estimateNodeLength(el) + 2, 0);
            case 'ObjectLiteral':
                return 4 + node.properties.reduce((n, prop) => {
                    if (!prop) return n;
                    if (prop.type === 'SpreadElement') return n + 3 + this.estimateNodeLength(prop.argument);
                    return n + String(prop.key ?? '').length + 2 + this.estimateNodeLength(prop.value) + 2;
                }, 0);
            case 'AnonymousFunction':
                return 20 + (node.params?.length ?? 0) * 4;
            default:
                return 24;
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
        if (node.decorators && node.decorators.length > 0) {
            for (const decorator of node.decorators) {
                this.visitNode(decorator);
            }
        }
        if (node.isExported) {
            this.write(this.currentIndent + 'export ');
        } else {
            this.write(this.currentIndent);
        }
        this.write(`function ${node.name}(`);
        const params = node.params.map(pNode => {
            let name = typeof pNode === 'string' ? pNode : pNode.name;
            if (node.defaults[name]) {
                const defaultValue = this.format(node.defaults[name]).trim();
                return `${name}: ${defaultValue}`;
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

    visitDecorator(node) {
        this.write(this.currentIndent + '@');
        // Disable indent for decorator name as we already wrote currentIndent
        const oldIndent = this.currentIndent;
        this.currentIndent = '';
        this.visitNode(node.name);
        this.currentIndent = oldIndent;

        if (node.arguments) {
            this.write('(');
            node.arguments.forEach((arg, i) => {
                this.visitNode(arg); // This might add indent if visitNode adds it...
                if (i < node.arguments.length - 1) this.write(', ');
            });
            this.write(')');
        }
        this.write('\n');
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

    visitGuardStatement(node) {
        this.write(this.currentIndent + 'guard ');
        this.visitNode(node.condition);
        this.write('\n');
        this.writeLine('else');
        this.visitBlock(node.alternate);
        this.writeLine('end');
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
        const canUseFnShorthand =
            node.isFn === true &&
            node.body.length === 1 &&
            node.body[0]?.type === 'ReturnStatement' &&
            node.body[0]?.argument;

        if (canUseFnShorthand) {
            this.write('(fn');
            if (node.params.length > 0) {
                this.write(' ');
                const params = node.params.map((p) => {
                    const name = typeof p === 'string' ? p : p.name;
                    const defaultNode = node.defaults[name];
                    if (!defaultNode) return name;
                    const tempPrinter = new PrettyPrinter();
                    tempPrinter.visitNode(defaultNode);
                    return `${name}: ${tempPrinter.output}`;
                });
                this.write(params.join(' '));
            }
            if (node.restParam) {
                const restName = typeof node.restParam === 'string' ? node.restParam : node.restParam.name;
                this.write(`${node.params.length > 0 ? ' ' : ' '}...${restName}`);
            }
            this.write(' -> ');
            this.visitNode(node.body[0].argument);
            this.write(')');
            return;
        }

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

    visitInlineIfExpression(node) {
        this.write('if ');
        this.visitNode(node.condition);
        this.write(' then ');
        this.visitNode(node.consequent);
        this.write(' else ');
        this.visitNode(node.alternate);
    }

    visitPipeExpression(node) {
        const flattenPipe = (expr) => {
            const stages = [];
            let current = expr;
            while (current?.type === 'PipeExpression') {
                stages.unshift(current);
                current = current.left;
            }
            return { initial: current, stages };
        };

        const { initial, stages } = flattenPipe(node);
        this.visitNode(initial);
        this.write('\n');

        const stageIndent = this.currentIndent + this.indentation;
        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i];
            this.write(stageIndent + '|> ');
            if (stage.callee.type === 'InlineIfExpression') {
                this.visitNode(stage.callee);
            } else {
                this.visitNode(stage.callee);
                if (stage.args.length > 0) {
                    this.write(' ');
                    stage.args.forEach((arg, idx) => {
                        this.visitNode(arg);
                        if (idx < stage.args.length - 1) this.write(' ');
                    });
                }
            }
            if (i < stages.length - 1) this.write('\n');
        }
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
        this.writeLine(`import ${node.alias} from "${node.path}"`);
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
            if (node.guard) {
                this.write(' when ');
                this.visitNode(node.guard);
            }
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
        const hasComplexElements = node.elements.some((el) =>
            ['ObjectLiteral', 'ArrayLiteral', 'AnonymousFunction', 'CallExpression'].includes(el?.type) ||
            (el?.type === 'SpreadElement' && ['ObjectLiteral', 'ArrayLiteral'].includes(el.argument?.type))
        );
        const shouldMultiline =
            node.elements.length > 4 ||
            (hasComplexElements && node.elements.length > 1) ||
            this.estimateNodeLength(node) > this.maxInlineArrayLength;

        if (!shouldMultiline || node.elements.length === 0) {
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
            return;
        }

        this.write('\n');
        this.indent();
        node.elements.forEach((el, i) => {
            this.write(this.currentIndent);
            if (el.type === 'SpreadElement') {
                this.write('...');
                this.visitNode(el.argument);
            } else {
                this.visitNode(el);
            }
            if (i < node.elements.length - 1) this.write(',');
            this.write('\n');
        });
        this.dedent();
        this.write(this.currentIndent + ']');
    }

    visitObjectLiteral(node) {
        if (node.properties.length === 0) {
            this.write('{}');
            return;
        }
        const hasComplexValues = node.properties.some((prop) =>
            prop?.type === 'SpreadElement' ||
            ['ObjectLiteral', 'ArrayLiteral', 'AnonymousFunction', 'CallExpression'].includes(prop?.value?.type)
        );
        const shouldMultiline =
            node.properties.length > 4 ||
            hasComplexValues ||
            this.estimateNodeLength(node) > this.maxInlineObjectLength;

        if (!shouldMultiline) {
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
            return;
        }

        this.write('{\n');
        this.indent();
        node.properties.forEach((prop, i) => {
            this.write(this.currentIndent);
            if (prop && prop.type === 'SpreadElement') {
                this.write('...');
                this.visitNode(prop.argument);
            } else {
                this.write(`${prop.key}: `);
                this.visitNode(prop.value);
            }
            if (i < node.properties.length - 1) this.write(',');
            this.write('\n');
        });
        this.dedent();
        this.write(this.currentIndent + '}');
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

    visitSafeArrayAccess(node) {
        this.visitNode(node.object);
        this.write(`?.[`);
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

    visitSafeCallExpression(node) {
        this.visitNode(node.callee);
        this.write('?.(');
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
