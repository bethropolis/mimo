import { BuiltinFunction } from "./BuiltinFunction.js";
import { stringify } from "./Utils.js";
import { arraySlice as stdlibArraySlice } from "./stdlib/array/accessFunctions.js";

export const builtinFunctions = {
  len: new BuiltinFunction(
    "len",
    ([value], interpreter, callNode) => {
      if (Array.isArray(value)) return value.length;
      if (typeof value === "string") return value.length;
      throw interpreter.errorHandler.createRuntimeError(
        `len() expects an array or string. Got '${typeof value}'.`,
        callNode,
        "TYPE001",
        "Provide an array or string to len()."
      );
    },
    1
  ),

  get: new BuiltinFunction(
    "get",
    ([collection, key], interpreter, callNode) => {
      if (Array.isArray(collection)) {
        if (typeof key !== "number" || !Number.isInteger(key)) {
          throw interpreter.errorHandler.createRuntimeError(
            `Array index must be an integer. Got '${typeof key}'.`,
            callNode,
            "TYPE001"
          );
        }
        if (key < 0 || key >= collection.length) {
          // Return null for out-of-bounds access, a safe default.
          return null;
        }
        return collection[key];
      }
      if (typeof collection === "object" && collection !== null) {
        return collection[key] ?? null; // Return null if property doesn't exist
      }
      throw interpreter.errorHandler.createRuntimeError(
        `Cannot 'get' from type '${typeof collection}'. Expected array or object.`,
        callNode,
        "TYPE002"
      );
    },
    2
  ),

  update: new BuiltinFunction(
    "update",
    ([collection, key, value], interpreter, callNode) => {
      if (Array.isArray(collection)) {
        if (typeof key !== "number" || !Number.isInteger(key)) {
          throw interpreter.errorHandler.createRuntimeError(
            `Array index must be an integer. Got '${typeof key}'.`,
            callNode,
            "TYPE001"
          );
        }
        if (key < 0) {
          // Allow assignment to the end of the array
          throw interpreter.errorHandler.createRuntimeError(
            `Index ${key} cannot be negative.`,
            callNode,
            "INDEX001"
          );
        }
        // Allow growing the array
        if (key > collection.length) {
          // Fill sparse elements with null, like JS does with 'undefined'
          for (let i = collection.length; i < key; i++) {
            collection[i] = null;
          }
        }
        collection[key] = value;
        return value; // Return the assigned value
      }
      if (typeof collection === "object" && collection !== null) {
        collection[key] = value;
        return value;
      }
      throw interpreter.errorHandler.createRuntimeError(
        `Cannot 'update' on type '${typeof collection}'. Expected array or object.`,
        callNode,
        "TYPE002"
      );
    },
    3
  ),

  type: new BuiltinFunction(
    "type",
    ([value], interpreter, callNode) => {
      if (value === null) return "null";
      if (Array.isArray(value)) return "array";
      if (typeof value === "object" && value !== null) return "object";
      return typeof value;
    },
    1
  ),

  push: new BuiltinFunction(
    "push",
    ([array, value], interpreter, callNode) => {
      if (!Array.isArray(array)) {
        throw interpreter.errorHandler.createRuntimeError(
          "push() requires an array as first argument",
          callNode,
          "TYPE001",
          "Provide an array as the first argument to push()."
        );
      }
      array.push(value);
      return array;
    },
    2
  ),

  pop: new BuiltinFunction(
    "pop",
    ([array], interpreter, callNode) => {
      if (!Array.isArray(array)) {
        throw interpreter.errorHandler.createRuntimeError(
          "pop() requires an array",
          callNode,
          "TYPE001",
          "Provide an array to pop()."
        );
      }
      if (array.length === 0) {
        throw interpreter.errorHandler.createRuntimeError(
          "Cannot pop from empty array",
          callNode,
          "INDEX001",
          "Check if the array has elements before calling pop()."
        );
      }
      return array.pop();
    },
    1
  ),

  slice: new BuiltinFunction(
    "slice",
    ([array, start, end], interpreter, callNode) => {
      if (!Array.isArray(array)) {
        throw interpreter.errorHandler.createRuntimeError(
          "slice() requires an array as first argument",
          callNode,
          "TYPE001",
          "Provide an array as the first argument to slice()."
        );
      }
      return stdlibArraySlice.call(interpreter, [array, start, end], callNode);
    },
    [1, 3],
    "Creates a shallow copy of a portion of an array into a new array object selected from `start` to `end` (end not included).",
    [
      { name: "array", type: "array", description: "The array to slice." },
      {
        name: "start",
        type: "number",
        description:
          "The beginning index of the specified portion of the array. If negative, it is treated as an offset from the end of the array.",
      },
      {
        name: "end",
        type: "number",
        optional: true,
        description:
          "The end index of the specified portion of the array. If omitted, slice extracts through the end of the array. If negative, it is treated as an offset from the end of the array.",
      },
    ],
    "array"
  ),

  range: new BuiltinFunction(
    "range",
    (args, interpreter, callNode) => {
      if (args.length < 1 || args.length > 3) {
        throw interpreter.errorHandler.createRuntimeError(
          "range() expects 1 to 3 arguments (end, [start], [step]).",
          callNode,
          "BUILTIN001",
          "Provide a valid number of arguments to range()."
        );
      }

      let start = 0;
      let end;
      let step = 1;

      if (args.length === 1) {
        end = args[0];
      } else if (args.length === 2) {
        start = args[0];
        end = args[1];
      } else {
        // 3 arguments
        start = args[0];
        end = args[1];
        step = args[2];
      }

      // Type checking
      if (
        typeof start !== "number" ||
        typeof end !== "number" ||
        typeof step !== "number"
      ) {
        throw interpreter.errorHandler.createRuntimeError(
          "range() arguments must be numbers.",
          callNode,
          "TYPE001",
          "Ensure start, end, and step values are numbers."
        );
      }

      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        !Number.isInteger(step)
      ) {
        throw interpreter.errorHandler.createRuntimeError(
          "range() arguments must be integers.",
          callNode,
          "TYPE001",
          "Ensure start, end, and step values are whole numbers."
        );
      }

      if (step === 0) {
        throw interpreter.errorHandler.createRuntimeError(
          "range() step argument cannot be zero.",
          callNode,
          "ARG001",
          "Provide a non-zero step value."
        );
      }

      const result = [];
      if (step > 0) {
        for (let i = start; i < end; i += step) {
          result.push(i);
        }
      } else {
        // step < 0
        for (let i = start; i > end; i += step) {
          result.push(i);
        }
      }
      return result;
    },
    [1, 3]
  ),

  join: new BuiltinFunction(
    "join",
    ([array, separator], interpreter, callNode) => {
      if (!Array.isArray(array)) {
        throw interpreter.errorHandler.createRuntimeError(
          "join() requires an array as first argument",
          callNode,
          "TYPE001",
          "Provide an array as the first argument to join()."
        );
      }
      if (typeof separator !== "string") {
        throw interpreter.errorHandler.createRuntimeError(
          "join() requires a string separator as second argument",
          callNode,
          "TYPE001",
          "Provide a string as the second argument to join()."
        );
      }
      return array.map(stringify).join(separator);
    },
    2
  ),

  // Object utility functions
  has_property: new BuiltinFunction(
    "has_property",
    ([object, property], interpreter, callNode) => {
      if (object === null || object === undefined) {
        return false;
      }
      if (typeof object !== "object") {
        return false;
      }
      const propertyKey = String(property);
      return Object.prototype.hasOwnProperty.call(object, propertyKey);
    },
    2
  ),

  keys: new BuiltinFunction(
    "keys",
    ([object], interpreter, callNode) => {
      if (object === null || object === undefined) {
        throw interpreter.errorHandler.createRuntimeError(
          "keys() requires a non-null object.",
          callNode,
          "TYPE001",
          "Provide an object or array to keys()."
        );
      }
      if (typeof object !== "object") {
        throw interpreter.errorHandler.createRuntimeError(
          "keys() requires an object argument.",
          callNode,
          "TYPE001",
          "Provide an object or array to keys()."
        );
      }
      if (Array.isArray(object)) {
        return Object.keys(object).map(Number);
      }
      return Object.keys(object);
    },
    1
  ),

  values: new BuiltinFunction(
    "values",
    ([object], interpreter, callNode) => {
      if (object === null || object === undefined) {
        throw interpreter.errorHandler.createRuntimeError(
          "values() requires a non-null object.",
          callNode,
          "TYPE001",
          "Provide an object or array to values()."
        );
      }
      if (typeof object !== "object") {
        throw interpreter.errorHandler.createRuntimeError(
          "values() requires an object argument.",
          callNode,
          "TYPE001",
          "Provide an object or array to values()."
        );
      }
      return Object.values(object);
    },
    1
  ),

  entries: new BuiltinFunction(
    "entries",
    ([object], interpreter, callNode) => {
      if (object === null || object === undefined) {
        throw interpreter.errorHandler.createRuntimeError(
          "entries() requires a non-null object.",
          callNode,
          "TYPE001",
          "Provide an object or array to entries()."
        );
      }
      if (typeof object !== "object") {
        throw interpreter.errorHandler.createRuntimeError(
          "entries() requires an object argument.",
          callNode,
          "TYPE001",
          "Provide an object or array to entries()."
        );
      }
      return Object.entries(object);
    },
    1
  ),

  // Command Line Interface functions
  get_arguments: new BuiltinFunction(
    "get_arguments",
    (args, interpreter, callNode) => {
      return interpreter.adapter.getArguments();
    },
    0
  ),

  get_env: new BuiltinFunction(
    "get_env",
    (args, interpreter, callNode) => {
      const [variableName] = args;
      if (typeof variableName !== "string") {
        throw interpreter.errorHandler.createRuntimeError(
          "get_env() expects a string variable name as its argument.",
          callNode,
          "TYPE001",
          "Provide a string environment variable name."
        );
      }
      if (typeof interpreter.adapter.getEnvVariable !== "function") {
        throw interpreter.errorHandler.createRuntimeError(
          "Host adapter does not support getEnvVariable().",
          callNode,
          "ADAPTER001",
          "Use an adapter that supports environment variables."
        );
      }
      return interpreter.adapter.getEnvVariable(variableName) ?? null;
    },
    1
  ),

  exit_code: new BuiltinFunction(
    "exit_code",
    (args, interpreter, callNode) => {
      const [code] = args;
      if (typeof code !== "number") {
        throw interpreter.errorHandler.createRuntimeError(
          "exit_code() expects a numeric exit code as its argument.",
          callNode,
          "TYPE001",
          "Provide a number for the exit code."
        );
      }
      interpreter.adapter.exit(Math.floor(code));
      return null;
    },
    1
  ),

  coalesce: new BuiltinFunction(
    "coalesce",
    (args, interpreter, callNode) => {
      const [value, defaultValue] = args;

      if (value === null || value === undefined) {
        return defaultValue;
      }
      return value;
    },
    2
  ),

  get_property_safe: new BuiltinFunction(
    "get_property_safe",
    ([object, propertyName], interpreter, callNode) => {
      if (object === null || object === undefined) {
        return null; // Safe navigation returns null for null/undefined object
      }
      if (typeof propertyName !== "string") {
        throw interpreter.errorHandler.createRuntimeError(
          `get_property_safe() expects a string property name as argument 2. Got '${typeof propertyName}'.`,
          callNode,
          "TYPE001",
          'Provide a string literal for the property name (e.g., "name").'
        );
      }
      // Allow safe access on strings (e.g., `my_string?.length`)
      if (
        typeof object !== "object" &&
        typeof object !== "string" &&
        typeof object !== "function"
      ) {
        // Functions are objects too
        throw interpreter.errorHandler.createRuntimeError(
          `Cannot safely access property '${propertyName}' of non-object/non-string value of type '${typeof object}'.`,
          callNode,
          "TYPE002",
          "get_property_safe() is only applicable to objects, functions, or strings."
        );
      }
      // If the property doesn't exist, JS returns undefined. Map to Mimo's null.
      const value = object[propertyName];
      return value === undefined ? null : value;
    },
    2 // obj, property_name (as string)
  ),

  if_else: new BuiltinFunction(
    "if_else",
    ([condition, consequentValue, alternateValue], interpreter, callNode) => {
      if (interpreter.expressionEvaluator.isTruthy(condition)) {
        return consequentValue;
      } else {
        return alternateValue;
      }
    },
    3
  ),
};

export function initializeBuiltins(environment) {
  for (const [name, func] of Object.entries(builtinFunctions)) {
    environment.define(name, func);
  }
}
