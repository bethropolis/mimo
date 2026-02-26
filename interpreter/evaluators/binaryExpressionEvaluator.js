import { isTruthy } from '../Utils.js';
import { getMimoType } from '../suggestions.js';

export function evaluateBinaryExpression(interpreter, node) {
    const left = interpreter.visitNode(node.left);
    const right = interpreter.visitNode(node.right);

    // Type checking for arithmetic operations
    const isNumericOp = ['+', '-', '*', '/', '%', '<', '>', '<=', '>=', '??'].includes(node.operator);

    if (isNumericOp && node.operator !== '??' && (typeof left !== 'number' || typeof right !== 'number')) {
        // Special case: string concatenation with '+'
        if (node.operator === '+' && (typeof left === 'string' || typeof right === 'string')) {
            return String(left) + String(right);
        }
        throw interpreter.errorHandler.createRuntimeError(
            `Type error for '${node.operator}': expected number operands, received ${getMimoType(left)} and ${getMimoType(right)}.`,
            node,
            'TYPE001',
            `Ensure both operands for '${node.operator}' are numbers.`
        );
    }

    switch (node.operator) {
        case '??':
            return left !== null ? left : right;
        case '+':
            return left + right;
        case '-':
            return left - right;
        case '*':
            return left * right;
        case '/':
            if (right === 0) {
                throw interpreter.errorHandler.createRuntimeError(
                    "Type error for '/': expected non-zero divisor, received 0.",
                    node,
                    'MATH001',
                    "Ensure the divisor is not zero."
                );
            }
            return left / right;
        case '%':
            if (right === 0) {
                throw interpreter.errorHandler.createRuntimeError(
                    "Type error for '%': expected non-zero divisor, received 0.",
                    node,
                    'MATH001',
                    "Ensure the divisor is not zero."
                );
            }
            return left % right;
        case '>':
            return left > right;
        case '<':
            return left < right;
        case '>=':
            return left >= right;
        case '<=':
            return left <= right;
        case '=':
        case '==':
            return left === right;
        case '===':
            return left === right;
        case '!':
        case '!=':
            return left !== right;
        case '!==':
            return left !== right;
        case 'and':
        case '&&':
            return isTruthy(left) && isTruthy(right);
        case 'or':
        case '||':
            return isTruthy(left) || isTruthy(right);

        default:
            throw interpreter.errorHandler.createRuntimeError(
                `Unknown binary operator: '${node.operator}'.`,
                node,
                'OP001',
                "Check for typos in the operator."
            );
    }
}

export function evaluateUnaryExpression(interpreter, node) {
    const argument = interpreter.visitNode(node.argument);
    switch (node.operator) {
        case '-':
            if (typeof argument !== 'number') {
                throw interpreter.errorHandler.createRuntimeError(
                    `Type error for unary '-': expected number, received ${getMimoType(argument)}.`,
                    node,
                    'TYPE001',
                    'Provide a number for unary minus operation.'
                );
            }
            return -argument;
        case 'not':
            return !isTruthy(argument);
        default:
            throw interpreter.errorHandler.createRuntimeError(
                `Unknown unary operator: '${node.operator}'.`,
                node,
                'OP001',
                "Check for typos in the operator."
            );
    }
}
