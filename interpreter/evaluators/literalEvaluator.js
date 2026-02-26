// interpreter/evaluators/literalEvaluator.js
import { suggestNearestName } from "../suggestions.js";

export function evaluateIdentifier(interpreter, node) {
    try {
        return interpreter.currentEnv.lookup(node.name);
    } catch (error) {
        if (error?.message?.startsWith("Undefined variable:")) {
            const candidates = interpreter.currentEnv.getVisibleNames();
            const nearest = suggestNearestName(node.name, candidates);
            const suggestion = nearest
                ? `Did you mean '${nearest}'?`
                : "Declare the variable before using it.";
            throw interpreter.errorHandler.createRuntimeError(
                `Undefined variable '${node.name}'.`,
                node,
                "REF001",
                suggestion
            );
        }
        throw error;
    }
}

export function evaluateLiteral(interpreter, node) {
    return node.value;
}
