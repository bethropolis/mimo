import { BuiltinFunction } from "../BuiltinFunction.js";
import { stringify } from "../Utils.js";

// --- Helper: Deep Equality ---
function isDeepEqual(a, b) {
  if (a === b) return true;

  if (
    typeof a !== "object" ||
    a === null ||
    typeof b !== "object" ||
    b === null
  ) {
    return false;
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key) || !isDeepEqual(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

// --- Builtin Functions ---

const assertEq = new BuiltinFunction(
  "eq",
  (args, interpreter, callNode) => {
    const [actual, expected, message] = args;
    if (!isDeepEqual(actual, expected)) {
      const msg = message ? `: ${message}` : "";
      throw interpreter.errorHandler.createRuntimeError(
        `Assertion Failed${msg}.\n   Expected: ${stringify(expected)}\n   Actual:   ${stringify(actual)}`,
        callNode,
        "ASSERT_FAIL",
      );
    }
    return true;
  },
  [2, 3], // actual, expected, [message]
);

const assertNeq = new BuiltinFunction(
  "neq",
  (args, interpreter, callNode) => {
    const [actual, expected, message] = args;
    if (isDeepEqual(actual, expected)) {
      const msg = message ? `: ${message}` : "";
      throw interpreter.errorHandler.createRuntimeError(
        `Assertion Failed${msg}. Expected values to be different.`,
        callNode,
        "ASSERT_FAIL",
      );
    }
    return true;
  },
  [2, 3],
);

const assertTrue = new BuiltinFunction(
  "true",
  (args, interpreter, callNode) => {
    const [condition, message] = args;
    if (condition !== true) {
      const msg = message ? `: ${message}` : "";
      throw interpreter.errorHandler.createRuntimeError(
        `Assertion Failed${msg}. Expected true, got ${stringify(condition)}`,
        callNode,
        "ASSERT_FAIL",
      );
    }
    return true;
  },
  [1, 2],
);

const assertFalse = new BuiltinFunction(
  "false",
  (args, interpreter, callNode) => {
    const [condition, message] = args;
    if (condition !== false) {
      const msg = message ? `: ${message}` : "";
      throw interpreter.errorHandler.createRuntimeError(
        `Assertion Failed${msg}. Expected false, got ${stringify(condition)}`,
        callNode,
        "ASSERT_FAIL",
      );
    }
    return true;
  },
  [1, 2],
);

// Check if a function throws an error
const assertThrows = new BuiltinFunction(
  "throws",
  (args, interpreter, callNode) => {
    const [fn, message] = args;

    // The argument must be a callable Mimo function
    if (!fn || typeof fn.call !== "function") {
      throw interpreter.errorHandler.createRuntimeError(
        `assert.throws expects a function as the first argument.`,
        callNode,
        "TYPE001",
      );
    }

    try {
      // Attempt to execute the function with no arguments
      fn.call(interpreter, [], callNode);
    } catch (error) {
      // It threw an error, which is what we wanted!
      return true;
    }

    // If we get here, it didn't throw
    const msg = message ? `: ${message}` : "";
    throw interpreter.errorHandler.createRuntimeError(
      `Assertion Failed${msg}. Expected function to throw an error, but it did not.`,
      callNode,
      "ASSERT_FAIL",
    );
  },
  [1, 2],
);

export const assertModule = {
  eq: assertEq,
  neq: assertNeq,
  true: assertTrue,
  false: assertFalse,
  throws: assertThrows,
};
