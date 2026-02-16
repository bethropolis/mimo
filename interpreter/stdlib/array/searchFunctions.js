import { BuiltinFunction } from "../../BuiltinFunction.js";
import { expectArray, expectNumber } from "./arrayUtils.js";

// --- Search and Query Functions ---

export const arrayIncludes = new BuiltinFunction(
  "includes",
  (args, interpreter, callNode) => {
    const [arr, valueToFind, fromIndexArg] = args;
    expectArray(arr, "includes", interpreter, callNode, 1);
    // valueToFind can be any Mimo value

    let fromIndex = 0;
    if (fromIndexArg !== undefined) {
      if (typeof fromIndexArg !== "number") {
        throw interpreter.errorHandler.createRuntimeError(
          `includes() fromIndex (arg 3) must be a number.`,
          callNode,
          'ARG001',
          `Provide a number for the fromIndex parameter.`
        );
      }
      fromIndex = fromIndexArg;
    }

    // Handle negative fromIndex
    if (fromIndex < 0) {
      fromIndex = Math.max(0, arr.length + fromIndex);
    }

    for (let i = fromIndex; i < arr.length; i++) {
      const currentValue = arr[i];
      if (Number.isNaN(valueToFind) && Number.isNaN(currentValue)) {
        return true;
      }
      if (currentValue === valueToFind) {
        return true;
      }
    }
    return false;
  },
  [2, 3], // array, valueToFind, [fromIndex]
);

export const arrayIndexOf = new BuiltinFunction(
  "index_of",
  (args, interpreter, callNode) => {
    const [arr, valueToFind, fromIndexArg] = args;
    expectArray(arr, "index_of", interpreter, callNode, 1);
    // valueToFind can be any Mimo value

    let fromIndex = 0;
    if (fromIndexArg !== undefined) {
      expectNumber(fromIndexArg, "index_of", interpreter, callNode, 3);
      fromIndex = fromIndexArg;
    }

    return arr.indexOf(valueToFind, fromIndex);
  },
  [2, 3], // array, valueToFind, [fromIndex]
);

export const arrayLastIndexOf = new BuiltinFunction(
  "last_index_of",
  (args, interpreter, callNode) => {
    const [arr, valueToFind, fromIndexArg] = args;
    expectArray(arr, "last_index_of", interpreter, callNode, 1);

    let fromIndex = arr.length - 1;
    if (fromIndexArg !== undefined) {
      expectNumber(fromIndexArg, "last_index_of", interpreter, callNode, 3);
      fromIndex = fromIndexArg;
    }
    return arr.lastIndexOf(valueToFind, fromIndex);
  },
  [2, 3], // array, valueToFind, [fromIndex]
);
