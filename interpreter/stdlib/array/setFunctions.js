import { BuiltinFunction } from '../../BuiltinFunction.js';
import { expectArray } from './arrayUtils.js';

export const arrayUnique = new BuiltinFunction("unique",
    (args, interpreter, callNode) => {
        const [arr] = args;
        expectArray(arr, "unique", interpreter, callNode, 1);

        // Use a Set to get unique values, then convert back to array
        // Note: This works for primitives. For objects/arrays, it checks reference equality.
        return [...new Set(arr)];
    },
    1
);

export const arrayIntersection = new BuiltinFunction("intersection",
    (args, interpreter, callNode) => {
        const [arr1, arr2] = args;
        expectArray(arr1, "intersection", interpreter, callNode, 1);
        expectArray(arr2, "intersection", interpreter, callNode, 2);

        const set2 = new Set(arr2);
        return arr1.filter(item => set2.has(item));
    },
    2
);

export const arrayUnion = new BuiltinFunction("union",
    (args, interpreter, callNode) => {
        const [arr1, arr2] = args;
        expectArray(arr1, "union", interpreter, callNode, 1);
        expectArray(arr2, "union", interpreter, callNode, 2);

        return [...new Set([...arr1, ...arr2])];
    },
    2
);

export const arrayDifference = new BuiltinFunction("difference",
    (args, interpreter, callNode) => {
        const [arr1, arr2] = args;
        expectArray(arr1, "difference", interpreter, callNode, 1);
        expectArray(arr2, "difference", interpreter, callNode, 2);

        const set2 = new Set(arr2);
        return arr1.filter(item => !set2.has(item));
    },
    2
);
