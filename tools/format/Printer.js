// tools/format/Printer.js

/**
 * PrettyPrinter — AST-to-source formatter for Mimo.
 *
 * Improvements over the original PrettyPrinter.js:
 *  - A1: Comment preservation (leadingComments / trailingComments on AST nodes)
 *  - A2: Blank-line logic applied inside blocks, not just at the top level
 *  - A3: Full estimateNodeLength coverage (no more 24-fallback for known types)
 *  - A4: State reset on every format() call — safe to reuse across files
 *  - A5: Decorator indent no longer leaks / zeroes global currentIndent
 *  - A6: Configurable indentSize, useTabs, quoteStyle via constructor options
 *  - A7: Dead code removed (pipe InlineIfExpression branch, rest-param ternary)
 *  - A8: Trailing newline always normalised to exactly one '\n'
 */
export class PrettyPrinter {
    /**
     * @param {object} options
     * @param {number}  [options.indentSize=4]              Spaces per indent level (ignored when useTabs=true)
     * @param {boolean} [options.useTabs=false]             Use a tab character instead of spaces
     * @param {'double'|'single'} [options.quoteStyle='double'] Quote character for string literals
     * @param {number}  [options.maxInlineArrayLength=100]  Max estimated length before array goes multiline
     * @param {number}  [options.maxInlineObjectLength=80]  Max estimated length before object goes multiline
     */
    constructor(options = {}) {
        this._indentUnit = options.useTabs
            ? '\t'
            : ' '.repeat(options.indentSize ?? 4);
        this._quote = options.quoteStyle === 'single' ? "'" : '"';
        this.maxInlineArrayLength = options.maxInlineArrayLength ?? 100;
        this.maxInlineObjectLength = options.maxInlineObjectLength ?? 80;

        // Mutable state — reset on every format() call (A4)
        this.currentIndent = '';
        this.output = '';
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Format a parsed AST and return the canonical source string.
     * Safe to call multiple times on the same instance.
     * @param {object} ast Program node
     * @returns {string} Formatted source, ending with exactly one newline (A8)
     */
    format(ast) {
        // A4: reset state so the same instance can be reused
        this.output = '';
        this.currentIndent = '';
        this.visitNode(ast);
        // A8: normalise trailing whitespace to exactly one newline
        return this.output.trimEnd() + '\n';
    }

    // ── Indent helpers ────────────────────────────────────────────────────────

    indent() {
        this.currentIndent += this._indentUnit;
    }

    dedent() {
        this.currentIndent = this.currentIndent.slice(0, -this._indentUnit.length);
    }

    write(text) {
        this.output += text;
    }

    writeLine(line = '') {
        this.output += this.currentIndent + line + '\n';
    }

    // ── Main dispatcher ───────────────────────────────────────────────────────

    visitNode(node) {
        if (!node || !node.type) return;
        const visitor = this[`visit${node.type}`];
        if (visitor) {
            visitor.call(this, node);
        } else {
            console.warn(`[PrettyPrinter] No visitor for AST node type: ${node.type}`);
            this.writeLine(`// UNKNOWN NODE: ${JSON.stringify(node)}`);
        }
    }

    // ── Block helper ──────────────────────────────────────────────────────────

    /**
     * Emit a list of statements with one extra indent level.
     * A2: applies blank-line logic between siblings (same rules as top-level).
     */
    visitBlock(statements) {
        this.indent();
        for (let i = 0; i < statements.length; i++) {
            const current = statements[i];
            const next = statements[i + 1];
            // A1: leading comments before this statement
            this._emitLeadingComments(current);
            this.visitNode(current);
            // A1: trailing inline comment after this statement
            this._emitTrailingComment(current);
            // A2: blank lines inside blocks
            if (next && this.shouldInsertBlankLine(current, next)) {
                this.write('\n');
            }
        }
        this.dedent();
    }

    // ── Comment helpers (A1) ──────────────────────────────────────────────────

    _emitLeadingComments(node) {
        if (!node?.leadingComments?.length) return;
        for (const c of node.leadingComments) {
            if (c.kind === 'block') {
                this.writeLine(`/* ${c.value} */`);
            } else {
                this.writeLine(`// ${c.value}`);
            }
        }
    }

    _emitTrailingComment(node) {
        if (!node?.trailingComment) return;
        const c = node.trailingComment;
        // trailing comment goes on the same line — we need to back up the '\n'
        // that the statement visitor already wrote, then re-add it after the comment.
        if (this.output.endsWith('\n')) {
            this.output = this.output.slice(0, -1);
        }
        if (c.kind === 'block') {
            this.write(` /* ${c.value} */`);
        } else {
            this.write(` // ${c.value}`);
        }
        this.write('\n');
    }

    // ── Blank-line logic ──────────────────────────────────────────────────────

    /**
     * Decide whether to emit an extra blank line between two adjacent statements.
     *
     * @param {object} current  AST node for the statement just emitted
     * @param {object} next     AST node for the upcoming statement
     * @param {number} [currentEndLine]  Last source line occupied by `current`
     *        (used to detect author-inserted blank lines).  When not supplied
     *        we fall back to `current.line` (conservative — always safe).
     */
    shouldInsertBlankLine(current, next, currentEndLine) {
        if (!current || !next) return false;

        // Keep import blocks tight; single blank line at the boundary.
        if (current.type === 'ImportStatement' && next.type === 'ImportStatement') return false;
        if (current.type === 'ImportStatement' || next.type === 'ImportStatement') return true;

        // ── Preserve author intent ────────────────────────────────────────────
        // If the original source had at least one blank line between the end of
        // `current` and the start of `next`, honour it unconditionally.
        const endLine = currentEndLine ?? current.line;
        if (next.line - endLine >= 2) return true;

        // Honour explicit empty-show visual separators.
        if (this.isEmptyShowSeparator(current)) return true;

        // Surround block-like constructs with breathing room.
        if (this.isBlockLike(current) || this.isBlockLike(next)) return true;

        // Consecutive simple statements with no blank line in source → keep tight.
        return false;
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
            'LabeledStatement',
        ].includes(node?.type);
    }

    isEmptyShowSeparator(node) {
        return (
            node?.type === 'ShowStatement' &&
            node.expression?.type === 'Literal' &&
            node.expression.value === ''
        );
    }

    // ── Length estimator (A3 — complete coverage) ─────────────────────────────

    estimateNodeLength(node) {
        if (!node) return 0;
        switch (node.type) {
            case 'Identifier':
                return node.name.length;
            case 'Literal':
                return typeof node.value === 'string'
                    ? node.value.length + 2
                    : String(node.value).length;
            case 'PropertyAccess':
            case 'SafePropertyAccess':
                return this.estimateNodeLength(node.object) + 1 + String(node.property ?? '').length;
            case 'ArrayAccess':
            case 'SafeArrayAccess':
                return this.estimateNodeLength(node.object) + this.estimateNodeLength(node.index) + 2;
            case 'ModuleAccess':
                return String(node.module ?? '').length + 1 + String(node.property ?? '').length;
            case 'CallExpression':
            case 'SafeCallExpression':
                return 7
                    + this.estimateNodeLength(node.callee)
                    + node.arguments.reduce((n, arg) => n + this.estimateNodeLength(arg) + 2, 0);
            case 'BinaryExpression':
                return String(node.operator ?? '').length + 2
                    + this.estimateNodeLength(node.left)
                    + this.estimateNodeLength(node.right);
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
            // A3: previously fell through to the 24 default ↓
            case 'SpreadElement':
                return 3 + this.estimateNodeLength(node.argument);
            case 'RangeLiteral':
                return this.estimateNodeLength(node.start) + 4 + this.estimateNodeLength(node.end);
            case 'InlineIfExpression':
                return 10
                    + this.estimateNodeLength(node.condition)
                    + this.estimateNodeLength(node.consequent)
                    + this.estimateNodeLength(node.alternate);
            case 'TemplateLiteral':
                return 2 + (node.parts ?? []).reduce((n, p) => {
                    if (p.type === 'Literal') return n + String(p.value).length;
                    return n + this.estimateNodeLength(p) + 3; // ${ }
                }, 0);
            case 'PipeExpression': {
                // flatten the chain and sum stage lengths
                let total = 0;
                let cur = node;
                while (cur?.type === 'PipeExpression') {
                    total += this.estimateNodeLength(cur.callee ?? cur.right) + 4;
                    cur = cur.left;
                }
                return total + this.estimateNodeLength(cur);
            }
            default:
                return 24;
        }
    }

    // ── Statement visitors ────────────────────────────────────────────────────

    visitProgram(node) {
        // Program-level leading comments (e.g. file header comments not
        // attached to any statement, collected by CommentAttacher)
        if (node.leadingComments?.length) {
            for (const c of node.leadingComments) {
                if (c.kind === 'block') {
                    this.writeLine(`/* ${c.value} */`);
                } else {
                    this.writeLine(`// ${c.value}`);
                }
            }
            if (node.body.length) this.write('\n');
        }

        for (let i = 0; i < node.body.length; i++) {
            const current = node.body[i];
            const next = node.body[i + 1];
            this._emitLeadingComments(current);
            this.visitNode(current);
            this._emitTrailingComment(current);
            if (next && this.shouldInsertBlankLine(current, next)) {
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
        if (node.decorators?.length > 0) {
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
        const params = this._formatParams(node.params, node.defaults, node.restParam);
        this.write(params.join(', '));
        this.write(')\n');
        this.visitBlock(node.body);
        this.writeLine('end');
    }

    visitDecorator(node) {
        // A5: write the full line directly — no currentIndent manipulation needed.
        // visitNode(node.name) for an Identifier just calls write(node.name), which is safe.
        this.write(this.currentIndent + '@');
        this.write(typeof node.name === 'string' ? node.name : node.name.name ?? '');
        if (node.arguments?.length) {
            this.write('(');
            node.arguments.forEach((arg, i) => {
                this.visitNode(arg);
                if (i < node.arguments.length - 1) this.write(', ');
            });
            this.write(')');
        }
        this.write('\n');
    }

    visitIfStatement(node) {
        this.write(this.currentIndent + 'if ');
        this._visitIfBody(node);
    }

    /**
     * Emit the condition, consequent, and optional alternate for an if statement.
     * Called after the caller has already written the leading `if `.
     * currentIndent must be at the correct outer level throughout — never zeroed.
     *
     * NOTE: We never emit `else if` as a single construct. The parser always
     * requires two `end`s for a chained else-if (the inner if consumes its own
     * `end`, then the outer if expects another). So we always emit the fully
     * explicit nested form:
     *
     *   else
     *       if <condition>
     *           ...
     *       end
     *   end
     */
    _visitIfBody(node) {
        this.visitNode(node.condition);
        this.write('\n');
        this.visitBlock(node.consequent);
        if (node.alternate) {
            if (node.alternate.type === 'IfStatement') {
                // Nested else-if: emit as explicit else + indented if block.
                this.writeLine('else');
                this.visitBlock([node.alternate]);
            } else {
                this.writeLine('else');
                this.visitBlock(node.alternate);
            }
        }
        this.writeLine('end');
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
        if (node.label) this.writeLine(`${node.label}:`);
        this.writeLine('loop');
        this.visitBlock(node.body);
        this.writeLine('end');
    }

    visitLabeledStatement(node) {
        this.writeLine(`${node.label}:`);
        this.visitNode(node.statement);
    }

    visitTryStatement(node) {
        this.writeLine('try');
        this.visitBlock(node.tryBlock);
        if (node.catchBlock?.length > 0) {
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

    visitImportStatement(node) {
        this.writeLine(`import ${node.alias} from "${node.path}"`);
    }

    visitMatchStatement(node) {
        this.write(this.currentIndent + 'match ');
        this.visitNode(node.discriminant);
        this.write('\n');
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

    // ── Expression visitors ───────────────────────────────────────────────────

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
            const q = this._quote;
            // Escape the chosen quote character within the string value
            const escaped = node.value.replace(new RegExp(q, 'g'), `\\${q}`);
            this.write(`${q}${escaped}${q}`);
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
                if (prop?.type === 'SpreadElement') {
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
            if (prop?.type === 'SpreadElement') {
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

    visitSpreadElement(node) {
        this.write('...');
        this.visitNode(node.argument);
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
        this.write('[');
        this.visitNode(node.index);
        this.write(']');
    }

    visitSafeArrayAccess(node) {
        this.visitNode(node.object);
        this.write('?.[');
        this.visitNode(node.index);
        this.write(']');
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

    visitAnonymousFunction(node) {
        const canUseFnShorthand =
            node.isFn === true &&
            node.body.length === 1 &&
            node.body[0]?.type === 'ReturnStatement' &&
            node.body[0]?.argument;

        if (canUseFnShorthand) {
            this.write('(fn');
            const params = this._formatFnParams(node.params, node.defaults, node.restParam);
            if (params.length > 0) {
                // A7: removed dead ternary — always a space before params
                this.write(' ' + params.join(' '));
            }
            this.write(' -> ');
            this.visitNode(node.body[0].argument);
            this.write(')');
            return;
        }

        this.write('(function(');
        const params = this._formatParams(node.params, node.defaults, node.restParam);
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
        // Flatten the right-deep chain
        const stages = [];
        let current = node;
        while (current?.type === 'PipeExpression') {
            stages.unshift(current);
            current = current.left;
        }
        const initial = current;

        this.visitNode(initial);
        this.write('\n');

        const stageIndent = this.currentIndent + this._indentUnit;
        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i];
            this.write(stageIndent + '|> ');
            // A7: dead InlineIfExpression branch removed — unified path
            this.visitNode(stage.callee);
            if (stage.args?.length > 0) {
                this.write(' ');
                stage.args.forEach((arg, idx) => {
                    this.visitNode(arg);
                    if (idx < stage.args.length - 1) this.write(' ');
                });
            }
            if (i < stages.length - 1) this.write('\n');
        }
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

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Format params for named functions and full anonymous functions (comma-separated).
     * Uses a fresh Printer with same options so defaults are rendered consistently.
     */
    _formatParams(params, defaults, restParam) {
        const out = params.map((p) => {
            const name = typeof p === 'string' ? p : p.name;
            const defaultNode = defaults?.[name];
            if (defaultNode) {
                const tmp = new PrettyPrinter({
                    indentSize: this._indentUnit.length,
                    useTabs: this._indentUnit === '\t',
                    quoteStyle: this._quote === "'" ? 'single' : 'double',
                    maxInlineArrayLength: this.maxInlineArrayLength,
                    maxInlineObjectLength: this.maxInlineObjectLength,
                });
                tmp.visitNode(defaultNode);
                return `${name}: ${tmp.output.trimEnd()}`;
            }
            return name;
        });
        if (restParam) {
            const restName = typeof restParam === 'string' ? restParam : restParam.name;
            out.push(`...${restName}`);
        }
        return out;
    }

    /**
     * Format params for `fn` shorthand (space-separated, no commas).
     */
    _formatFnParams(params, defaults, restParam) {
        return this._formatParams(params, defaults, restParam);
    }
}
