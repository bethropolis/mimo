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

export const arrayFlat = new BuiltinFunction("flat",
    (args, interpreter, callNode) => {
        const [arr, depthArg] = args;
        expectArray(arr, "flat", interpreter, callNode, 1);
        const depth = depthArg === undefined ? 1 : depthArg;
        if (typeof depth !== "number" || !Number.isInteger(depth) || depth < 0) {
            throw interpreter.errorHandler.createRuntimeError(
                "flat() depth must be a non-negative integer.",
                callNode,
                "TYPE001",
                "Provide a non-negative integer for flat depth."
            );
        }

        const flatten = (input, currentDepth) => {
            if (currentDepth === 0) return [...input];
            const result = [];
            for (const item of input) {
                if (Array.isArray(item)) {
                    result.push(...flatten(item, currentDepth - 1));
                } else {
                    result.push(item);
                }
            }
            return result;
        };

        return flatten(arr, depth);
    },
    [1, 2]
);

export const arrayFlatMap = new BuiltinFunction("flat_map",
    (args, interpreter, callNode) => {
        const [arr, callbackFn] = args;
        expectArray(arr, "flat_map", interpreter, callNode, 1);
        expectMimoFunction(callbackFn, "flat_map", interpreter, callNode, 2);

        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const fullArgs = [arr[i], i, arr];
            const callArgs = fullArgs.slice(0, callbackFn.declaration.params.length);
            const mapped = callbackFn.call(interpreter, callArgs);
            if (Array.isArray(mapped)) {
                result.push(...mapped);
            } else {
                result.push(mapped);
            }
        }
        return result;
    },
    2
);

export const arrayGroupBy = new BuiltinFunction("group_by",
    (args, interpreter, callNode) => {
        const [arr, callbackFn] = args;
        expectArray(arr, "group_by", interpreter, callNode, 1);
        expectMimoFunction(callbackFn, "group_by", interpreter, callNode, 2);

        const groups = {};
        for (let i = 0; i < arr.length; i++) {
            const fullArgs = [arr[i], i, arr];
            const callArgs = fullArgs.slice(0, callbackFn.declaration.params.length);
            const keyValue = callbackFn.call(interpreter, callArgs);
            const key = String(keyValue);
            if (!Object.prototype.hasOwnProperty.call(groups, key)) {
                groups[key] = [];
            }
            groups[key].push(arr[i]);
        }
        return groups;
    },
    2
);

export const arrayCount = new BuiltinFunction("count",
    (args, interpreter, callNode) => {
        const [arr, callbackFn] = args;
        expectArray(arr, "count", interpreter, callNode, 1);

        if (callbackFn === undefined) {
            return arr.length;
        }
        expectMimoFunction(callbackFn, "count", interpreter, callNode, 2);

        let matched = 0;
        for (let i = 0; i < arr.length; i++) {
            const fullArgs = [arr[i], i, arr];
            const callArgs = fullArgs.slice(0, callbackFn.declaration.params.length);
            const keep = callbackFn.call(interpreter, callArgs);
            if (interpreter.expressionEvaluator.isTruthy(keep)) {
                matched++;
            }
        }
        return matched;
    },
    [1, 2]
);

export const arrayZip = new BuiltinFunction("zip",
    (args, interpreter, callNode) => {
        if (args.length < 2) {
            throw interpreter.errorHandler.createRuntimeError(
                "zip() expects at least 2 arrays.",
                callNode,
                "BUILTIN001",
                "Provide at least two arrays to zip()."
            );
        }

        args.forEach((arg, index) => expectArray(arg, "zip", interpreter, callNode, index + 1));

        const minLen = Math.min(...args.map((a) => a.length));
        const zipped = [];
        for (let i = 0; i < minLen; i++) {
            zipped.push(args.map((a) => a[i]));
        }
        return zipped;
    },
    [2, Infinity]
);

export const arrayChunk = new BuiltinFunction("chunk",
    (args, interpreter, callNode) => {
        const [arr, size] = args;
        expectArray(arr, "chunk", interpreter, callNode, 1);
        if (typeof size !== "number" || !Number.isInteger(size) || size <= 0) {
            throw interpreter.errorHandler.createRuntimeError(
                "chunk() size must be a positive integer.",
                callNode,
                "TYPE001",
                "Provide a positive integer as chunk size."
            );
        }

        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    },
    2
);
