import { BuiltinFunction } from '../../BuiltinFunction.js';
import { expectArray, expectNumber } from './arrayUtils.js';

// --- Access and Extraction Functions ---

export const arraySlice = new BuiltinFunction("slice",
    (args, interpreter, callNode) => {
        const [arr, beginIndexArg, endIndexArg] = args;
        expectArray(arr, "slice", interpreter, callNode, 1);

        let beginIndex = 0;
        // If beginIndexArg is provided and NOT null, then validate it as a number.
        if (beginIndexArg !== undefined && beginIndexArg !== null) {
            expectNumber(beginIndexArg, "slice", interpreter, callNode, 2);
            beginIndex = beginIndexArg;
        }
        // If beginIndexArg IS undefined or null, beginIndex remains its default (0).

        let endIndex = arr.length;
        // If endIndexArg is provided and NOT null, then validate it as a number.
        if (endIndexArg !== undefined && endIndexArg !== null) {
            expectNumber(endIndexArg, "slice", interpreter, callNode, 3);
            endIndex = endIndexArg;
        }
        // If endIndexArg IS undefined or null, endIndex remains its default (arr.length).

        // The native JavaScript Array.prototype.slice method already handles
        // undefined/null for its arguments gracefully, so we can pass `beginIndex`
        // and `endIndex` directly.
        // Note: JS `slice` also handles negative indices which is great for your test.
        return arr.slice(beginIndex, endIndex);
    },
    [1, 3] // array, [beginIndex], [endIndex] - arity remains 1 to 3
);

export const arrayFirst = new BuiltinFunction("first",
    (args, interpreter, callNode) => {
        const [arr] = args;
        expectArray(arr, "first", interpreter, callNode, 1);
        return arr.length > 0 ? arr[0] : null;
    },
    1
);

export const arrayLast = new BuiltinFunction("last",
    (args, interpreter, callNode) => {
        const [arr] = args;
        expectArray(arr, "last", interpreter, callNode, 1);
        return arr.length > 0 ? arr[arr.length - 1] : null;
    },
    1
);

export const arrayIsEmpty = new BuiltinFunction("is_empty",
    (args, interpreter, callNode) => {
        const [arr] = args;
        expectArray(arr, "is_empty", interpreter, callNode, 1);
        return arr.length === 0;
    },
    1
);