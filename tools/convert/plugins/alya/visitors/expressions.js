/**
 * Expression visitors for the Mimo → Alya converter.
 *
 * Each evaluator method returns the register NAME (without '@') that holds
 * the computed result. Callers must call freeTemp() for every allocTemp()
 * they triggered.
 */

export const expressionVisitors = {
    // =========================================================================
    // Literals
    // =========================================================================

    evalLiteral(node) {
        const val = node.value;

        if (typeof val === 'number') {
            const tmp = this.allocTemp();
            if (Number.isInteger(val)) {
                // Represent negatives via two's complement trick the assembler supports
                if (val < 0) {
                    this.writeLine(`@${tmp} := -${Math.abs(val)}`);
                } else {
                    this.writeLine(`@${tmp} := ${val}`);
                }
            } else {
                // Float: embed as bit-pattern comment, store integer part only
                this.writeLine(`; FLOAT ${val} — stored as truncated integer ${Math.trunc(val)}`);
                this.writeLine(`@${tmp} := ${Math.trunc(val)}`);
            }
            return tmp;
        }

        if (typeof val === 'boolean') {
            const tmp = this.allocTemp();
            this.writeLine(`@${tmp} := ${val ? 1 : 0}`);
            return tmp;
        }

        if (typeof val === 'string') {
            // String literals: use LoadString + syscall
            const tmp = this.allocTemp();
            this.writeLine(`@${tmp} := "${val.replace(/"/g, '\\"')}"`);
            return tmp;
        }

        if (val === null) {
            const tmp = this.allocTemp();
            this.writeLine(`@${tmp} := 0  ; null`);
            return tmp;
        }

        const tmp = this.allocTemp();
        this.writeLine(`; UNSUPPORTED literal type ${typeof val}`);
        this.writeLine(`@${tmp} := 0`);
        return tmp;
    },

    // =========================================================================
    // Identifiers
    // =========================================================================

    evalIdentifier(node) {
        // Return a "virtual register" that IS the variable.
        // Alya allows @any_name so we don't need to copy.
        return node.name;
    },

    // =========================================================================
    // Binary expressions
    // =========================================================================

    evalBinary(node) {
        const lReg = this.evalExpr(node.left);
        const rReg = this.evalExpr(node.right);

        const op = node.operator;
        const tmp = this.allocTemp();

        switch (op) {
            // Arithmetic
            case '+':  this.writeLine(`@${tmp} := @${lReg} + @${rReg}`); break;
            case '-':  this.writeLine(`@${tmp} := @${lReg} - @${rReg}`); break;
            case '*':  this.writeLine(`@${tmp} := @${lReg} * @${rReg}`); break;
            case '/':  this.writeLine(`@${tmp} := @${lReg} / @${rReg}`); break;
            case '%':  this.writeLine(`@${tmp} := @${lReg} % @${rReg}`); break;

            // Comparison — produce 0/1 integer result
            case '=':
            case '==': this._emitCmp(tmp, lReg, rReg, '=='); break;
            case '!=':
            case '!':  this._emitCmp(tmp, lReg, rReg, '!='); break;
            case '<':  this._emitCmp(tmp, lReg, rReg, '<');  break;
            case '>':  this._emitCmp(tmp, lReg, rReg, '>');  break;
            case '<=': this._emitCmp(tmp, lReg, rReg, '<='); break;
            case '>=': this._emitCmp(tmp, lReg, rReg, '>='); break;

            // Logical — short-circuit is expensive without branches;
            // for simple boolean values we use bitwise AND/OR on 0/1 integers.
            case 'and': this.writeLine(`@${tmp} := @${lReg} & @${rReg}`); break;
            case 'or':  this.writeLine(`@${tmp} := @${lReg} | @${rReg}`); break;

            // Bitwise
            case '&':  this.writeLine(`@${tmp} := @${lReg} & @${rReg}`); break;
            case '|':  this.writeLine(`@${tmp} := @${lReg} | @${rReg}`); break;
            case '^':  this.writeLine(`@${tmp} := @${lReg} ^ @${rReg}`); break;
            case '<<': this.writeLine(`@${tmp} := @${lReg} << @${rReg}`); break;
            case '>>': this.writeLine(`@${tmp} := @${lReg} >> @${rReg}`); break;

            default:
                this.writeLine(`; UNSUPPORTED binary operator: ${op}`);
                this.writeLine(`@${tmp} := 0`);
        }

        // Free operand temps (only if they are actual temps, not variable names)
        this._maybeFreeTemp(rReg);
        this._maybeFreeTemp(lReg);

        return tmp;
    },

    /**
     * Emit a comparison that leaves 1/0 in @dest.
     * Pattern: load 1; if NOT condition goto skip; dest stays 1; skip: (else load 0)
     * Actually simpler: load 1, then if cond holds goto done, else load 0; done:
     */
    _emitCmp(dest, lReg, rReg, op) {
        const trueLabel = this.newLabel('cmpT');
        const endLabel  = this.newLabel('cmpE');
        // Invert the operator to jump to the "false" path
        const invertOp = { '==': '!=', '!=': '==', '<': '>=', '>': '<=', '<=': '>', '>=': '<' };
        const jumpOp = invertOp[op] || '!=';
        this.writeLine(`@${dest} := 1`);
        this.writeLine(`if @${lReg} ${op} @${rReg} goto ${trueLabel}`);
        this.writeLine(`@${dest} := 0`);
        this.writeLine(`goto ${endLabel}`);
        this.writeLine(`${trueLabel}:`);
        this.writeLine(`${endLabel}:`);
    },

    // =========================================================================
    // Unary expressions
    // =========================================================================

    evalUnary(node) {
        const argReg = this.evalExpr(node.argument);
        const tmp = this.allocTemp();

        switch (node.operator) {
            case '-':
                // negate: 0 - x
                this.writeLine(`@${tmp} := 0`);
                this.writeLine(`@${tmp} := @${tmp} - @${argReg}`);
                break;
            case 'not':
            case '!': {
                // Boolean NOT: 1 if argReg == 0, else 0
                const skipLabel = this.newLabel('notT');
                const endLabel  = this.newLabel('notE');
                this.writeLine(`@${tmp} := 0`);
                this.writeLine(`if @${argReg} != 0 goto ${skipLabel}`);
                this.writeLine(`@${tmp} := 1`);
                this.writeLine(`goto ${endLabel}`);
                this.writeLine(`${skipLabel}:`);
                this.writeLine(`${endLabel}:`);
                break;
            }
            case '~':
                this.writeLine(`@${tmp} := ~@${argReg}`);
                break;
            default:
                this.writeLine(`; UNSUPPORTED unary: ${node.operator}`);
                this.writeLine(`@${tmp} := @${argReg}`);
        }

        this._maybeFreeTemp(argReg);
        return tmp;
    },

    // =========================================================================
    // Inline if expression:  if cond then a else b
    // =========================================================================

    evalInlineIf(node) {
        const condReg = this.evalExpr(node.condition);
        const result  = this.allocTemp();
        const elseLabel = this.newLabel('iiE');
        const endLabel  = this.newLabel('iiF');

        this.writeLine(`if @${condReg} == 0 goto ${elseLabel}`);
        this._maybeFreeTemp(condReg);

        // Consequent
        const thenReg = this.evalExpr(node.consequent);
        this.writeLine(`@${result} := @${thenReg}`);
        this._maybeFreeTemp(thenReg);
        this.writeLine(`goto ${endLabel}`);

        this.writeLine(`${elseLabel}:`);
        const altReg = this.evalExpr(node.alternate);
        this.writeLine(`@${result} := @${altReg}`);
        this._maybeFreeTemp(altReg);

        this.writeLine(`${endLabel}:`);
        return result;
    },

    // =========================================================================
    // Call expression (used when a call appears inside an expression)
    // =========================================================================

    evalCall(node) {
        // Evaluate and pass arguments via @__a0, @__a1, …
        const argRegs = (node.arguments || []).map((arg) => this.evalExpr(arg));
        argRegs.forEach((reg, i) => {
            this.writeLine(`@__a${i} := @${reg}`);
        });
        argRegs.forEach((reg) => this._maybeFreeTemp(reg));

        // Get callee name
        let calleeName = null;
        if (node.callee.type === 'Identifier') {
            calleeName = node.callee.name;
        } else if (node.callee.type === 'ModuleAccess') {
            calleeName = `${node.callee.module}__${node.callee.property}`;
        }

        if (!calleeName) {
            this.writeLine(`; UNSUPPORTED: complex callee in expression`);
            const tmp = this.allocTemp();
            this.writeLine(`@${tmp} := 0`);
            return tmp;
        }

        // If inside a function, save/restore live registers around the call
        if (this._inFunction) {
            this._emitCallWithSave(calleeName);
        } else {
            this.writeLine(`call ${calleeName}`);
        }

        // Return value is in @__ret — copy to a temp so the caller can use it
        const tmp = this.allocTemp();
        this.writeLine(`@${tmp} := @__ret`);
        return tmp;
    },

    // =========================================================================
    // Internal helper: only free if this is a temp (starts with __t)
    // =========================================================================

    _maybeFreeTemp(regName) {
        if (regName && regName.startsWith('__t')) {
            this.freeTemp();
        }
    },
};
