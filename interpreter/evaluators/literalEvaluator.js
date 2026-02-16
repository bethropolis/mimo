// interpreter/evaluators/literalEvaluator.js

export function evaluateIdentifier(interpreter, node) {
    return interpreter.currentEnv.lookup(node.name);
}

export function evaluateLiteral(interpreter, node) {
    return node.value;
}
