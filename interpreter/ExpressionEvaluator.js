import {
    evaluateBinaryExpression,
    evaluateUnaryExpression,
} from "./evaluators/binaryExpressionEvaluator.js";
import {
    evaluateIdentifier,
    evaluateLiteral,
} from "./evaluators/literalEvaluator.js";
import {
    evaluateArrayLiteral,
    evaluateArrayAccess,
    evaluateObjectLiteral,
    evaluatePropertyAccess,
    evaluateSafePropertyAccess,
    evaluateSafeArrayAccess,
} from "./evaluators/collectionEvaluator.js";
import {
    evaluateAnonymousFunction,
    evaluateCallExpression,
    evaluateSafeCallExpression,
} from "./evaluators/functionCallEvaluator.js";
import { evaluateTemplateLiteral } from "./evaluators/templateLiteralEvaluator.js";
import { evaluateModuleAccess } from "./evaluators/moduleAccessEvaluator.js";

export class ExpressionEvaluator {
    constructor(interpreter) {
        this.interpreter = interpreter;
    }

    evaluateExpression(node) {
        switch (node.type) {
            case "BinaryExpression":
                return evaluateBinaryExpression(this.interpreter, node);
            case "UnaryExpression":
                return evaluateUnaryExpression(this.interpreter, node);
            case "Identifier":
                return evaluateIdentifier(this.interpreter, node);
            case "Literal":
                return evaluateLiteral(this.interpreter, node);
            case "ArrayLiteral":
                return evaluateArrayLiteral(this.interpreter, node);
            case "ObjectLiteral":
                return evaluateObjectLiteral(this.interpreter, node);
            case "PropertyAccess":
                return evaluatePropertyAccess(this.interpreter, node);
            case "SafePropertyAccess":
                return evaluateSafePropertyAccess(this.interpreter, node);
            case "SafeArrayAccess":
                return evaluateSafeArrayAccess(this.interpreter, node);
            case "ArrayAccess":
                return evaluateArrayAccess(this.interpreter, node);
            case "ModuleAccess":
                return evaluateModuleAccess(this.interpreter, node);
            case "AnonymousFunction":
                return evaluateAnonymousFunction(this.interpreter, node);
            case "TemplateLiteral":
                return evaluateTemplateLiteral(this.interpreter, node);
            case "CallExpression":
                return evaluateCallExpression(this.interpreter, node);
            case "SafeCallExpression":
                return evaluateSafeCallExpression(this.interpreter, node);
            case "InlineIfExpression":
                return this.isTruthy(this.interpreter.visitNode(node.condition))
                    ? this.interpreter.visitNode(node.consequent)
                    : this.interpreter.visitNode(node.alternate);
            case "PipeExpression": {
                // Evaluate the piped value (left side)
                const pipedValue = this.interpreter.visitNode(node.left);

                // Evaluate the callee — if it's an inline-if, we get the function from it
                let func;
                if (node.callee.type === "InlineIfExpression") {
                    func = this.isTruthy(this.interpreter.visitNode(node.callee.condition))
                        ? this.interpreter.visitNode(node.callee.consequent)
                        : this.interpreter.visitNode(node.callee.alternate);
                } else {
                    func = this.interpreter.visitNode(node.callee);
                }

                // Evaluate any extra args, then prepend the piped value
                const extraArgs = node.args.map(arg => this.interpreter.visitNode(arg));
                const allArgs = [pipedValue, ...extraArgs];

                // Call the function
                return func.call(this.interpreter, allArgs, node);
            }
            default:
                throw new Error(`Unknown expression type: ${node.type}`);
        }
    }

    // Keep isTruthy as a utility method in case it's used elsewhere
    isTruthy(value) {
        // JavaScript-like truthiness: false, 0, "", null, undefined are falsy
        if (
            value === false ||
            value === 0 ||
            value === "" ||
            value === null ||
            value === undefined
        ) {
            return false;
        }
        return true;
    }
}
