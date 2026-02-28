/**
 * Statement visitors for the Mimo → Alya converter.
 * Mixed into MimoToAlyaConverter via Object.assign.
 */

export const statementVisitors = {
    // =========================================================================
    // Program
    // =========================================================================

    visitProgram(node) {
        // Handled by convert() — should not be called directly.
        (node.body || []).forEach((stmt) => this.visitNode(stmt));
    },

    // =========================================================================
    // show statement  →  print @reg (integers/booleans)
    //                    syscall    (strings)
    // =========================================================================

    visitShowStatement(node) {
        const reg = this.evalExpr(node.expression);
        const exprNode = node.expression;

        // If the expression is a string literal, use syscall 2
        if (exprNode.type === 'Literal' && typeof exprNode.value === 'string') {
            this.writeLine(`; show (string)`);
            this.writeLine(`@r0 := 2`);
            this.writeLine(`@r1 := @${reg}`);
            this.writeLine(`syscall`);
        } else {
            this.writeLine(`print @${reg}`);
        }

        this._maybeFreeTemp(reg);
    },

    // =========================================================================
    // Variable declarations  (set / let / const)
    // =========================================================================

    visitVariableDeclaration(node) {
        // Track as a local if we're inside a function
        this._trackLocal(node.identifier);

        const reg = this.evalExpr(node.value);
        if (reg !== node.identifier) {
            this.writeLine(`@${node.identifier} := @${reg}`);
            this._maybeFreeTemp(reg);
        }
        // If evalExpr returned the variable name itself (identifier → itself), no copy needed.
    },

    // =========================================================================
    // Return statement
    // =========================================================================

    visitReturnStatement(node) {
        if (node.argument) {
            const reg = this.evalExpr(node.argument);
            this.writeLine(`@__ret := @${reg}`);
            this._maybeFreeTemp(reg);
        } else {
            this.writeLine(`@__ret := 0`);
        }
        this.writeLine(`return`);
    },

    // =========================================================================
    // Function declaration — deferred to _emitFunction in to_alya.js
    // =========================================================================

    visitFunctionDeclaration(node) {
        // Top-level functions are collected in convert() and emitted before __main.
        // If we encounter a nested function declaration (not supported), warn and skip.
        if (this._inFunction) {
            this.writeLine(`; UNSUPPORTED: nested function declaration '${node.name}'`);
        }
        // Already handled in convert(); nothing to emit here.
    },

    // =========================================================================
    // Call statement  (standalone call, with optional destination)
    // =========================================================================

    visitCallStatement(node) {
        // Evaluate args
        const argRegs = (node.arguments || []).map((arg) => this.evalExpr(arg));
        argRegs.forEach((reg, i) => {
            this.writeLine(`@__a${i} := @${reg}`);
        });
        argRegs.forEach((reg) => this._maybeFreeTemp(reg));

        // Callee
        let calleeName = null;
        if (node.callee.type === 'Identifier') {
            calleeName = node.callee.name;
        } else if (node.callee.type === 'ModuleAccess') {
            calleeName = `${node.callee.module}__${node.callee.property}`;
        }

        if (!calleeName) {
            this.writeLine(`; UNSUPPORTED: complex callee`);
            return;
        }

        // If inside a function, save/restore live registers around the call
        if (this._inFunction) {
            this._emitCallWithSave(calleeName);
        } else {
            this.writeLine(`call ${calleeName}`);
        }

        // Capture return value if destination specified
        if (node.destination) {
            this.writeLine(`@${node.destination.name} := @__ret`);
        }
    },

    // =========================================================================
    // Assignment operators  (+=, -=, *=, /=, etc.)
    // These appear as VariableDeclaration nodes with kind 'set' after
    // the variable is already declared, OR as separate AssignmentStatement
    // nodes (if the parser emits them that way).
    // =========================================================================

    visitAssignmentStatement(node) {
        // node.identifier: string name
        // node.operator: '=', '+=', '-=', '*=', '/='
        // node.value: expression node
        const reg = this.evalExpr(node.value);
        const op = node.operator;

        switch (op) {
            case '=':
                if (reg !== node.identifier) {
                    this.writeLine(`@${node.identifier} := @${reg}`);
                }
                break;
            case '+=': this.writeLine(`@${node.identifier} += @${reg}`); break;
            case '-=': this.writeLine(`@${node.identifier} -= @${reg}`); break;
            case '*=': this.writeLine(`@${node.identifier} *= @${reg}`); break;
            case '/=': this.writeLine(`@${node.identifier} /= @${reg}`); break;
            default:
                // Fallback: evaluate and assign
                this.writeLine(`; assignment op '${op}' mapped to plain assign`);
                this.writeLine(`@${node.identifier} := @${reg}`);
        }

        this._maybeFreeTemp(reg);
    },

    visitPropertyAssignment(node) {
        this.writeLine(`; UNSUPPORTED: PropertyAssignment`);
    },

    visitBracketAssignment(node) {
        this.writeLine(`; UNSUPPORTED: BracketAssignment`);
    },

    visitDestructuringAssignment(node) {
        this.writeLine(`; UNSUPPORTED: DestructuringAssignment`);
    },

    // =========================================================================
    // if / else if / else
    // =========================================================================

    visitIfStatement(node) {
        const endLabel = this.newLabel('ifEnd');
        this._emitIfChain(node, endLabel);
        this.writeLine(`${endLabel}:`);
    },

    _emitIfChain(node, endLabel) {
        const condReg = this.evalExpr(node.condition);
        const nextLabel = this.newLabel('ifNext');

        // Jump past this branch if condition is false (== 0)
        this.writeLine(`if @${condReg} == 0 goto ${nextLabel}`);
        this._maybeFreeTemp(condReg);

        // Consequent block
        (node.consequent || []).forEach((stmt) => this.visitNode(stmt));
        this.writeLine(`goto ${endLabel}`);

        this.writeLine(`${nextLabel}:`);

        if (node.alternate) {
            if (node.alternate.type === 'IfStatement') {
                // else if chain
                this._emitIfChain(node.alternate, endLabel);
            } else if (Array.isArray(node.alternate)) {
                // plain else block
                node.alternate.forEach((stmt) => this.visitNode(stmt));
            } else {
                // single statement alternate
                this.visitNode(node.alternate);
            }
        }
    },

    visitGuardStatement(node) {
        // guard condition else <block> end
        // → if (!condition) { block }
        const condReg = this.evalExpr(node.condition);
        const skipLabel = this.newLabel('guardEnd');
        this.writeLine(`if @${condReg} != 0 goto ${skipLabel}`);
        this._maybeFreeTemp(condReg);
        (node.alternate || node.elseBlock || []).forEach((stmt) => this.visitNode(stmt));
        this.writeLine(`${skipLabel}:`);
    },

    // =========================================================================
    // while loop
    // =========================================================================

    visitWhileStatement(node) {
        const loopLabel = this.newLabel('wLoop');
        const endLabel  = this.newLabel('wEnd');

        this.pushLoop(endLabel, loopLabel);

        this.writeLine(`${loopLabel}:`);

        const condReg = this.evalExpr(node.condition);
        this.writeLine(`if @${condReg} == 0 goto ${endLabel}`);
        this._maybeFreeTemp(condReg);

        (node.body || []).forEach((stmt) => this.visitNode(stmt));
        this.writeLine(`goto ${loopLabel}`);
        this.writeLine(`${endLabel}:`);

        this.popLoop();
    },

    // =========================================================================
    // for … in <iterable>
    //
    // Only range() is supported.  Produces:
    //   @var := start
    //   loop: if @var >= end goto end
    //     body
    //     @var += 1 (or step)
    //   goto loop
    //   end:
    // =========================================================================

    visitForStatement(node) {
        const varName = node.variable.name;
        const loopLabel = this.newLabel('fLoop');
        const endLabel  = this.newLabel('fEnd');
        const iterable  = node.iterable;

        this.pushLoop(endLabel, loopLabel);

        // Only support range() iterables
        if (iterable.type === 'RangeLiteral' ||
            (iterable.type === 'CallExpression' &&
             iterable.callee?.name === 'range')) {
            this._emitForRange(varName, loopLabel, endLabel, iterable, node.body || []);
        } else if (iterable.type === 'RangeLiteral') {
            this._emitForRange(varName, loopLabel, endLabel, iterable, node.body || []);
        } else {
            this.writeLine(`; UNSUPPORTED for-in: only range() is supported`);
        }

        this.popLoop();
    },

    _emitForRange(varName, loopLabel, endLabel, rangeNode, body) {
        // RangeLiteral: { start, end }  (step always 1 in Mimo)
        // CallExpression to range(start, end) — also 1 step
        let startNode, endNode;

        if (rangeNode.type === 'RangeLiteral') {
            startNode = rangeNode.start;
            endNode   = rangeNode.end;
        } else {
            // range(start, end) call
            const args = rangeNode.arguments || [];
            if (args.length === 1) {
                startNode = { type: 'Literal', value: 0 };
                endNode   = args[0];
            } else {
                startNode = args[0];
                endNode   = args[1];
            }
        }

        const startReg = this.evalExpr(startNode);
        this.writeLine(`@${varName} := @${startReg}`);
        this._maybeFreeTemp(startReg);

        const endReg = this.evalExpr(endNode);
        // Stash the end value in a dedicated register so the loop condition
        // doesn't re-evaluate it on every iteration.
        const endVar = `__fe${this._labelCounter}`;
        this.writeLine(`@${endVar} := @${endReg}`);
        this._maybeFreeTemp(endReg);

        this.writeLine(`${loopLabel}:`);
        this.writeLine(`if @${varName} >= @${endVar} goto ${endLabel}`);
        body.forEach((stmt) => this.visitNode(stmt));
        this.writeLine(`@${varName} += 1`);
        this.writeLine(`goto ${loopLabel}`);
        this.writeLine(`${endLabel}:`);
    },

    // =========================================================================
    // loop … end  (infinite loop with break/continue)
    // =========================================================================

    visitLoopStatement(node) {
        const loopLabel = this.newLabel('loop');
        const endLabel  = this.newLabel('loopEnd');

        this.pushLoop(endLabel, loopLabel);
        this.writeLine(`${loopLabel}:`);
        (node.body || []).forEach((stmt) => this.visitNode(stmt));
        this.writeLine(`goto ${loopLabel}`);
        this.writeLine(`${endLabel}:`);
        this.popLoop();
    },

    // =========================================================================
    // break / continue
    // =========================================================================

    visitBreakStatement(node) {
        const loop = this.currentLoop();
        if (loop) {
            this.writeLine(`goto ${loop.breakLabel}`);
        } else {
            this.writeLine(`; break outside loop — ignored`);
        }
    },

    visitContinueStatement(node) {
        const loop = this.currentLoop();
        if (loop) {
            this.writeLine(`goto ${loop.continueLabel}`);
        } else {
            this.writeLine(`; continue outside loop — ignored`);
        }
    },

    // =========================================================================
    // Labeled statement (Mimo: label name ... end)
    // =========================================================================

    visitLabeledStatement(node) {
        this.writeLine(`${node.label}:`);
        this.visitNode(node.statement);
    },

    // =========================================================================
    // try / catch / throw  — not supported
    // =========================================================================

    visitTryStatement(node) {
        this.writeLine(`; UNSUPPORTED: try/catch — executing try block only`);
        (node.tryBlock || []).forEach((stmt) => this.visitNode(stmt));
    },

    visitThrowStatement(node) {
        this.writeLine(`; UNSUPPORTED: throw — emitting halt`);
        this.writeLine(`halt`);
    },

    // =========================================================================
    // import — not supported
    // =========================================================================

    visitImportStatement(node) {
        this.writeLine(`; UNSUPPORTED: import '${node.path}' as ${node.alias}`);
    },

    // =========================================================================
    // Decorators — not supported
    // =========================================================================

    visitDecoratorStatement(node) {
        this.writeLine(`; UNSUPPORTED: decorator`);
    },

    // =========================================================================
    // Pipe expression statement (rare but possible)
    // =========================================================================

    visitPipeExpression(node) {
        const reg = this.evalExpr(node);
        this._maybeFreeTemp(reg);
    },

    // =========================================================================
    // Match statement — not supported
    // =========================================================================

    visitMatchStatement(node) {
        this.writeLine(`; UNSUPPORTED: match statement`);
    },
};
