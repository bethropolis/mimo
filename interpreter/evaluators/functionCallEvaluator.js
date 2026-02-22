// interpreter/evaluators/functionCallEvaluator.js

import { FunctionValue } from '../Values.js';
import { BuiltinFunction } from '../BuiltinFunction.js';
import { ErrorHandler } from '../ErrorHandler.js';

export function evaluateAnonymousFunction(interpreter, node) {
    // Create a function value with the current environment as closure
    return new FunctionValue(node, interpreter.currentEnv);
}

export function evaluateCallExpression(interpreter, node) {
    // Evaluate the callee (could be identifier or module access)
    let func;
    let functionName;

    if (typeof node.callee === 'string') {
        // Legacy support for string callee
        func = interpreter.currentEnv.lookup(node.callee);
        functionName = node.callee;
    } else {
        // New AST node callee (Identifier, ModuleAccess, or expression)
        func = interpreter.visitNode(node.callee);
        if (node.callee.type === 'ModuleAccess') {
            functionName = `${node.callee.module}.${node.callee.property}`;
        } else if (node.callee.type === 'Identifier') {
            functionName = node.callee.name;
        } else {
            functionName = '<anonymous function>';
        }
    }

    if (
        !(func instanceof FunctionValue) &&
        !(func instanceof BuiltinFunction)
    ) {
        throw interpreter.errorHandler.createRuntimeError(
            `'${functionName}' is not a callable function.`,
            node,
            'TYPE002',
            'Ensure you are calling a function or method.'
        );
    }

    const args = [];
    for (const arg of node.arguments) {
        if (arg.type === 'SpreadElement') {
            const spreadValue = interpreter.visitNode(arg.argument);
            if (!Array.isArray(spreadValue)) {
                throw interpreter.errorHandler.createRuntimeError(
                    `Cannot spread non-array value in function call.`,
                    arg.argument,
                    'TYPE001'
                );
            }
            args.push(...spreadValue);
        } else {
            args.push(interpreter.visitNode(arg));
        }
    }
    const result = func.call(interpreter, args, node); // Pass the CallExpression node

    return result;
}
