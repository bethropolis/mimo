import { BuiltinFunction } from '../../BuiltinFunction.js';
import { expectArray } from './arrayUtils.js';

// --- Transformation Functions ---

export const arraySort = new BuiltinFunction("sort",
    (args, interpreter, callNode) => {
        const [arr] = args;
        expectArray(arr, "sort", interpreter, callNode, 1);

        const newArray = [...arr];
        const allNumbers = newArray.every(item => typeof item === 'number');
        const allStrings = newArray.every(item => typeof item === 'string');

        if (allNumbers) {
            newArray.sort((a, b) => a - b);
        } else if (allStrings) {
            newArray.sort();
        } else {
            // Mixed types: convert to strings for comparison
            newArray.sort((a, b) => String(a).localeCompare(String(b)));
        }

        return newArray;
    },
    1
);

export const arrayReverse = new BuiltinFunction("reverse",
    (args, interpreter, callNode) => {
        const [arr] = args;
        expectArray(arr, "reverse", interpreter, callNode, 1);
        const newArray = [...arr];
        return newArray.reverse();
    },
    1
);

export const arrayConcat = new BuiltinFunction("concat",
    (args, interpreter, callNode) => {
        if (args.length === 0) {
            return [];
        }
        let resultArray = [];
        for (let i = 0; i < args.length; i++) {
            const currentArg = args[i];
            expectArray(currentArg, "concat", interpreter, callNode, i + 1);
            resultArray = resultArray.concat(currentArg);
        }
        return resultArray;
    },
    [1, Infinity] // At least 1 array, but can concatenate many
);