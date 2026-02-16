import { FunctionValue } from '../../Values.js';

// --- Helper for type checking ---
export function expectArray(arg, funcName, interpreter, callNode, argPosition = 1) {
    if (!Array.isArray(arg)) {
        throw interpreter.errorHandler.createRuntimeError(
            `${funcName}() expects an array as argument ${argPosition}. Got '${typeof arg}'.`,
            callNode,
            'TYPE001',
            `Ensure argument ${argPosition} for '${funcName}' is an array.`
        );
    }
}

export function expectMimoFunction(arg, funcName, interpreter, callNode, argPosition = 1) {
    if (!(arg instanceof FunctionValue)) {
        throw interpreter.errorHandler.createRuntimeError(
            `${funcName}() expects a Mimo function as argument ${argPosition}. Got '${typeof arg}'.`,
            callNode,
            'TYPE001',
            `Ensure argument ${argPosition} for '${funcName}' is a function.`
        );
    }
}

// Helper for number type checking
export function expectNumber(arg, funcName, interpreter, callNode, argPosition = 1) {
    if (typeof arg !== 'number') {
        throw interpreter.errorHandler.createRuntimeError(
            `${funcName}() expects a number as argument ${argPosition}. Got '${typeof arg}'.`,
            callNode,
            'TYPE001',
            `Ensure argument ${argPosition} for '${funcName}' is a number.`
        );
    }
}