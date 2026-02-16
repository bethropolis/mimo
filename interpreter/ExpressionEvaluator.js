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
} from "./evaluators/collectionEvaluator.js";
import {
    evaluateAnonymousFunction,
    evaluateCallExpression,
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
