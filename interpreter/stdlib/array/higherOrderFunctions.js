import { BuiltinFunction } from '../../BuiltinFunction.js';
import { expectArray, expectMimoFunction } from './arrayUtils.js';

// --- Higher-Order Functions ---

export const arrayMap = new BuiltinFunction("map",
    (args, interpreter, callNode) => {
        const [arr, callbackFn] = args;
        expectArray(arr, "map", interpreter, callNode, 1);
        expectMimoFunction(callbackFn, "map", interpreter, callNode, 2);

        const result = [];
        for (let i = 0; i < arr.length; i++) {
            // Call the Mimo callback function: callbackFn(item, index, array)
            const fullArgs = [arr[i], i, arr];
            // Only pass as many args as the function declares
            const callArgs = fullArgs.slice(0, callbackFn.declaration.params.length);
            const mappedValue = callbackFn.call(interpreter, callArgs);
            result.push(mappedValue);
        }
        return result;
    },
    2 // array, callbackFunction
);

export const arrayFilter = new BuiltinFunction("filter",
    (args, interpreter, callNode) => {
        const [arr, callbackFn] = args;
        expectArray(arr, "filter", interpreter, callNode, 1);
        expectMimoFunction(callbackFn, "filter", interpreter, callNode, 2);

        const result = [];
        for (let i = 0; i < arr.length; i++) {
            // Call the Mimo callback function: callbackFn(item, index, array)
            const fullArgs = [arr[i], i, arr];
            // Only pass as many args as the function declares
            const callArgs = fullArgs.slice(0, callbackFn.declaration.params.length);
            const shouldInclude = callbackFn.call(interpreter, callArgs);
            
            // Use the interpreter's truthy logic
            if (interpreter.expressionEvaluator.isTruthy(shouldInclude)) {
                result.push(arr[i]);
            }
        }
        return result;
    },
    2 // array, callbackFunction
);

export const arrayReduce = new BuiltinFunction("reduce",
    (args, interpreter, callNode) => {
        const [arr, callbackFn, initialValue] = args;
        expectArray(arr, "reduce", interpreter, callNode, 1);
        expectMimoFunction(callbackFn, "reduce", interpreter, callNode, 2);

        if (arr.length === 0 && initialValue === undefined) {
            throw interpreter.errorHandler.createRuntimeError(
                `reduce() of empty array with no initial value.`,
                callNode,
                'ARG001',
                `Provide an initial value to reduce() when operating on an empty array.`
            );
        }

        let accumulator = initialValue;
        let startIndex = 0;

        if (initialValue === undefined) {
            accumulator = arr[0];
            startIndex = 1;
        }

        for (let i = startIndex; i < arr.length; i++) {
            // Call the Mimo callback function: callbackFn(accumulator, currentValue, index, array)
            const fullArgs = [accumulator, arr[i], i, arr];
            const callArgs = fullArgs.slice(0, callbackFn.declaration.params.length);
            accumulator = callbackFn.call(interpreter, callArgs);
        }

        return accumulator;
    },
    [2, 3] // array, callbackFunction, [initialValue]
);

export const arrayForEach = new BuiltinFunction("for_each",
    (args, interpreter, callNode) => {
        const [arr, callbackFn] = args;
        expectArray(arr, "for_each", interpreter, callNode, 1);
        expectMimoFunction(callbackFn, "for_each", interpreter, callNode, 2);

        for (let i = 0; i < arr.length; i++) {
            const fullArgs = [arr[i], i, arr];
            const callArgs = fullArgs.slice(0, callbackFn.declaration.params.length);
            callbackFn.call(interpreter, callArgs);
        }

        return null; // for_each returns null/undefined
    },
    2 // array, callbackFunction
);

export const arrayFind = new BuiltinFunction("find",
    (args, interpreter, callNode) => {
        const [arr, callbackFn] = args;
        expectArray(arr, "find", interpreter, callNode, 1);
        expectMimoFunction(callbackFn, "find", interpreter, callNode, 2);

        for (let i = 0; i < arr.length; i++) {
            const fullArgs = [arr[i], i, arr];
            const callArgs = fullArgs.slice(0, callbackFn.declaration.params.length);
            const isMatch = callbackFn.call(interpreter, callArgs);
            if (interpreter.expressionEvaluator.isTruthy(isMatch)) {
                return arr[i];
            }
        }

        return null; // Not found
    },
    2 // array, callbackFunction
);

export const arrayFindIndex = new BuiltinFunction("find_index",
    (args, interpreter, callNode) => {
        const [arr, callbackFn] = args;
        expectArray(arr, "find_index", interpreter, callNode, 1);
        expectMimoFunction(callbackFn, "find_index", interpreter, callNode, 2);

        for (let i = 0; i < arr.length; i++) {
            const fullArgs = [arr[i], i, arr];
            const callArgs = fullArgs.slice(0, callbackFn.declaration.params.length);
            const isMatch = callbackFn.call(interpreter, callArgs);
            if (interpreter.expressionEvaluator.isTruthy(isMatch)) {
                return i;
            }
        }

        return -1; // Not found
    },
    2 // array, callbackFunction
);