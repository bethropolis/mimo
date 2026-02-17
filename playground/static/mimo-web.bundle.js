// ../interpreter/BuiltinFunction.js
class BuiltinFunction {
  constructor(name, implementation, arity) {
    this.name = name;
    this.implementation = implementation;
    this.arity = arity;
  }
  call(interpreter, args, callNode) {
    if (Array.isArray(this.arity)) {
      const [min, max] = this.arity;
      if (args.length < min || args.length > max) {
        throw interpreter.errorHandler.createRuntimeError(`Built-in function '${this.name}' expects ${min}-${max} arguments but received ${args.length}.`, callNode, "BUILTIN001", `Check the arguments provided to built-in function '${this.name}'.`);
      }
    } else {
      if (args.length !== this.arity) {
        throw interpreter.errorHandler.createRuntimeError(`Built-in function '${this.name}' expects ${this.arity} arguments but received ${args.length}.`, callNode, "BUILTIN001", `Check the arguments provided to built-in function '${this.name}'.`);
      }
    }
    return this.implementation(args, interpreter, callNode);
  }
}

// ../interpreter/Utils.js
function isTruthy(value) {
  if (value === null || value === undefined)
    return false;
  if (typeof value === "boolean")
    return value;
  if (typeof value === "number")
    return value !== 0;
  if (typeof value === "string")
    return value.length > 0;
  return true;
}
function stringify(value, useColors = false) {
  if (value === null || value === undefined)
    return useColors ? "\x1B[90mnull\x1B[0m" : "null";
  if (value instanceof Date) {
    const str = `datetime(${value.toISOString()})`;
    return useColors ? `\x1B[32m${str}\x1B[0m` : str;
  }
  if (Array.isArray(value)) {
    const items = value.map((v) => stringify(v, useColors)).join(useColors ? "\x1B[90m, \x1B[0m" : ", ");
    return useColors ? `\x1B[90m[\x1B[0m${items}\x1B[90m]\x1B[0m` : `[${items}]`;
  }
  if (value && typeof value === "object" && (value.constructor.name === "FunctionValue" || value.constructor.name === "BuiltinFunction")) {
    const label = value.name === "<anonymous>" ? "anonymous function" : `function ${value.name}`;
    return useColors ? `\x1B[36m[${label}]\x1B[0m` : `[${label}]`;
  }
  if (typeof value === "object" && value !== null) {
    const pairs = Object.entries(value).map(([key, val]) => {
      const k = useColors ? `\x1B[34m${key}\x1B[0m` : key;
      return `${k}: ${stringify(val, useColors)}`;
    });
    return useColors ? `\x1B[90m{\x1B[0m${pairs.join(useColors ? "\x1B[90m, \x1B[0m" : ", ")}\x1B[90m}\x1B[0m` : `{${pairs.join(", ")}}`;
  }
  if (typeof value === "string")
    return useColors ? `\x1B[32m"${value}"\x1B[0m` : value;
  if (typeof value === "number")
    return useColors ? `\x1B[33m${value}\x1B[0m` : String(value);
  if (typeof value === "boolean")
    return useColors ? `\x1B[35m${value}\x1B[0m` : String(value);
  return String(value);
}

// ../interpreter/environment.js
class Environment {
  constructor(parent = null, isGlobalScope = false, isFunctionContext = false) {
    this.vars = new Map;
    this.parent = parent;
    this.isGlobalScope = isGlobalScope;
    this.isFunctionContext = isFunctionContext;
    this.isModuleRoot = false;
  }
  define(name, value, kind = "set") {
    if (this.vars.has(name)) {
      const existing = this.vars.get(name);
      if (kind !== "set" || existing.kind !== "set") {
        throw new Error(`Variable '${name}' is already declared in this scope`);
      }
    }
    const mutable = kind !== "const";
    this.vars.set(name, { value, kind, mutable });
  }
  defineGlobal(name, value, kind = "set") {
    let globalEnv = this;
    while (globalEnv.parent !== null) {
      globalEnv = globalEnv.parent;
    }
    globalEnv.define(name, value, kind);
  }
  assign(name, value) {
    if (this.vars.has(name)) {
      const variable = this.vars.get(name);
      if (!variable.mutable) {
        throw new Error(`Cannot assign to const variable '${name}'`);
      }
      variable.value = value;
      return;
    }
    if (this.parent) {
      this.parent.assign(name, value);
      return;
    }
    throw new Error(`Undefined variable: ${name}`);
  }
  lookup(name) {
    if (this.vars.has(name)) {
      return this.vars.get(name).value;
    }
    if (this.parent) {
      return this.parent.lookup(name);
    }
    throw new Error(`Undefined variable: ${name}`);
  }
  hasInCurrentScope(name) {
    return this.vars.has(name);
  }
  getVariableInfo(name) {
    if (this.vars.has(name)) {
      return { info: this.vars.get(name), env: this };
    }
    if (this.isModuleRoot || this.isGlobalScope) {
      return null;
    }
    if (this.parent) {
      return this.parent.getVariableInfo(name);
    }
    return null;
  }
}

// ../interpreter/Values.js
class ReturnValue {
  constructor(value) {
    this.value = value;
  }
}

class BreakException {
  constructor(label = null) {
    this.label = label;
  }
}

class ContinueException {
  constructor(label = null) {
    this.label = label;
  }
}

class FunctionValue {
  constructor(declaration, closure) {
    this.declaration = declaration;
    this.closure = closure;
    this.name = declaration.name || "<anonymous>";
  }
  call(interpreter, args, callNode) {
    const { params, defaults, restParam } = this.declaration;
    const requiredParamsCount = params.filter((pNode) => !defaults[pNode.name]).length;
    if (args.length < requiredParamsCount) {
      throw interpreter.errorHandler.createRuntimeError(`Function '${this.name}' expects at least ${requiredParamsCount} arguments but received ${args.length}.`, callNode, "FUNC001");
    }
    if (!restParam && args.length > params.length) {
      throw interpreter.errorHandler.createRuntimeError(`Function '${this.name}' expects at most ${params.length} arguments but received ${args.length}.`, callNode, "FUNC002");
    }
    const env = new Environment(this.closure, false, true);
    params.forEach((paramNode, i) => {
      const paramName = paramNode.name;
      let value = args[i];
      if (value === undefined) {
        if (defaults[paramName]) {
          value = interpreter.visitNode(defaults[paramName]);
        } else {
          throw new Error(`Interpreter Error: Missing value for required parameter ${paramName}`);
        }
      }
      env.define(paramName, value);
    });
    if (restParam) {
      const restArgs = args.slice(params.length);
      env.define(restParam.name, restArgs);
    }
    interpreter.pushCallStack(this.name, callNode);
    try {
      const result = interpreter.executeBlock(this.declaration.body, env);
      if (result instanceof ReturnValue) {
        return result.value;
      }
      return null;
    } finally {
      interpreter.popCallStack();
    }
  }
}

// ../interpreter/stdlib/array/arrayUtils.js
function expectArray(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (!Array.isArray(arg)) {
    throw interpreter.errorHandler.createRuntimeError(`${funcName}() expects an array as argument ${argPosition}. Got '${typeof arg}'.`, callNode, "TYPE001", `Ensure argument ${argPosition} for '${funcName}' is an array.`);
  }
}
function expectMimoFunction(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (!(arg instanceof FunctionValue)) {
    throw interpreter.errorHandler.createRuntimeError(`${funcName}() expects a Mimo function as argument ${argPosition}. Got '${typeof arg}'.`, callNode, "TYPE001", `Ensure argument ${argPosition} for '${funcName}' is a function.`);
  }
}
function expectNumber(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (typeof arg !== "number") {
    throw interpreter.errorHandler.createRuntimeError(`${funcName}() expects a number as argument ${argPosition}. Got '${typeof arg}'.`, callNode, "TYPE001", `Ensure argument ${argPosition} for '${funcName}' is a number.`);
  }
}

// ../interpreter/stdlib/array/accessFunctions.js
var arraySlice = new BuiltinFunction("slice", (args, interpreter, callNode) => {
  const [arr, beginIndexArg, endIndexArg] = args;
  expectArray(arr, "slice", interpreter, callNode, 1);
  let beginIndex = 0;
  if (beginIndexArg !== undefined && beginIndexArg !== null) {
    expectNumber(beginIndexArg, "slice", interpreter, callNode, 2);
    beginIndex = beginIndexArg;
  }
  let endIndex = arr.length;
  if (endIndexArg !== undefined && endIndexArg !== null) {
    expectNumber(endIndexArg, "slice", interpreter, callNode, 3);
    endIndex = endIndexArg;
  }
  return arr.slice(beginIndex, endIndex);
}, [1, 3]);
var arrayFirst = new BuiltinFunction("first", (args, interpreter, callNode) => {
  const [arr] = args;
  expectArray(arr, "first", interpreter, callNode, 1);
  return arr.length > 0 ? arr[0] : null;
}, 1);
var arrayLast = new BuiltinFunction("last", (args, interpreter, callNode) => {
  const [arr] = args;
  expectArray(arr, "last", interpreter, callNode, 1);
  return arr.length > 0 ? arr[arr.length - 1] : null;
}, 1);
var arrayIsEmpty = new BuiltinFunction("is_empty", (args, interpreter, callNode) => {
  const [arr] = args;
  expectArray(arr, "is_empty", interpreter, callNode, 1);
  return arr.length === 0;
}, 1);

// ../interpreter/coreBuiltins.js
var builtinFunctions = {
  len: new BuiltinFunction("len", ([value], interpreter, callNode) => {
    if (Array.isArray(value))
      return value.length;
    if (typeof value === "string")
      return value.length;
    throw interpreter.errorHandler.createRuntimeError(`len() expects an array or string. Got '${typeof value}'.`, callNode, "TYPE001", "Provide an array or string to len().");
  }, 1),
  get: new BuiltinFunction("get", ([collection, key], interpreter, callNode) => {
    if (Array.isArray(collection)) {
      if (typeof key !== "number" || !Number.isInteger(key)) {
        throw interpreter.errorHandler.createRuntimeError(`Array index must be an integer. Got '${typeof key}'.`, callNode, "TYPE001");
      }
      if (key < 0 || key >= collection.length) {
        return null;
      }
      return collection[key];
    }
    if (typeof collection === "object" && collection !== null) {
      return collection[key] ?? null;
    }
    throw interpreter.errorHandler.createRuntimeError(`Cannot 'get' from type '${typeof collection}'. Expected array or object.`, callNode, "TYPE002");
  }, 2),
  update: new BuiltinFunction("update", ([collection, key, value], interpreter, callNode) => {
    if (Array.isArray(collection)) {
      if (typeof key !== "number" || !Number.isInteger(key)) {
        throw interpreter.errorHandler.createRuntimeError(`Array index must be an integer. Got '${typeof key}'.`, callNode, "TYPE001");
      }
      if (key < 0) {
        throw interpreter.errorHandler.createRuntimeError(`Index ${key} cannot be negative.`, callNode, "INDEX001");
      }
      if (key > collection.length) {
        for (let i = collection.length;i < key; i++) {
          collection[i] = null;
        }
      }
      collection[key] = value;
      return value;
    }
    if (typeof collection === "object" && collection !== null) {
      collection[key] = value;
      return value;
    }
    throw interpreter.errorHandler.createRuntimeError(`Cannot 'update' on type '${typeof collection}'. Expected array or object.`, callNode, "TYPE002");
  }, 3),
  type: new BuiltinFunction("type", ([value], interpreter, callNode) => {
    if (value === null)
      return "null";
    if (Array.isArray(value))
      return "array";
    if (typeof value === "object" && value !== null)
      return "object";
    return typeof value;
  }, 1),
  push: new BuiltinFunction("push", ([array, value], interpreter, callNode) => {
    if (!Array.isArray(array)) {
      throw interpreter.errorHandler.createRuntimeError("push() requires an array as first argument", callNode, "TYPE001", "Provide an array as the first argument to push().");
    }
    array.push(value);
    return array;
  }, 2),
  pop: new BuiltinFunction("pop", ([array], interpreter, callNode) => {
    if (!Array.isArray(array)) {
      throw interpreter.errorHandler.createRuntimeError("pop() requires an array", callNode, "TYPE001", "Provide an array to pop().");
    }
    if (array.length === 0) {
      throw interpreter.errorHandler.createRuntimeError("Cannot pop from empty array", callNode, "INDEX001", "Check if the array has elements before calling pop().");
    }
    return array.pop();
  }, 1),
  slice: new BuiltinFunction("slice", ([array, start, end], interpreter, callNode) => {
    if (!Array.isArray(array)) {
      throw interpreter.errorHandler.createRuntimeError("slice() requires an array as first argument", callNode, "TYPE001", "Provide an array as the first argument to slice().");
    }
    return arraySlice.call(interpreter, [array, start, end], callNode);
  }, [1, 3], "Creates a shallow copy of a portion of an array into a new array object selected from `start` to `end` (end not included).", [
    { name: "array", type: "array", description: "The array to slice." },
    {
      name: "start",
      type: "number",
      description: "The beginning index of the specified portion of the array. If negative, it is treated as an offset from the end of the array."
    },
    {
      name: "end",
      type: "number",
      optional: true,
      description: "The end index of the specified portion of the array. If omitted, slice extracts through the end of the array. If negative, it is treated as an offset from the end of the array."
    }
  ], "array"),
  range: new BuiltinFunction("range", (args, interpreter, callNode) => {
    if (args.length < 1 || args.length > 3) {
      throw interpreter.errorHandler.createRuntimeError("range() expects 1 to 3 arguments (end, [start], [step]).", callNode, "BUILTIN001", "Provide a valid number of arguments to range().");
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
      start = args[0];
      end = args[1];
      step = args[2];
    }
    if (typeof start !== "number" || typeof end !== "number" || typeof step !== "number") {
      throw interpreter.errorHandler.createRuntimeError("range() arguments must be numbers.", callNode, "TYPE001", "Ensure start, end, and step values are numbers.");
    }
    if (!Number.isInteger(start) || !Number.isInteger(end) || !Number.isInteger(step)) {
      throw interpreter.errorHandler.createRuntimeError("range() arguments must be integers.", callNode, "TYPE001", "Ensure start, end, and step values are whole numbers.");
    }
    if (step === 0) {
      throw interpreter.errorHandler.createRuntimeError("range() step argument cannot be zero.", callNode, "ARG001", "Provide a non-zero step value.");
    }
    const result = [];
    if (step > 0) {
      for (let i = start;i < end; i += step) {
        result.push(i);
      }
    } else {
      for (let i = start;i > end; i += step) {
        result.push(i);
      }
    }
    return result;
  }, [1, 3]),
  join: new BuiltinFunction("join", ([array, separator], interpreter, callNode) => {
    if (!Array.isArray(array)) {
      throw interpreter.errorHandler.createRuntimeError("join() requires an array as first argument", callNode, "TYPE001", "Provide an array as the first argument to join().");
    }
    if (typeof separator !== "string") {
      throw interpreter.errorHandler.createRuntimeError("join() requires a string separator as second argument", callNode, "TYPE001", "Provide a string as the second argument to join().");
    }
    return array.map(stringify).join(separator);
  }, 2),
  has_property: new BuiltinFunction("has_property", ([object, property], interpreter, callNode) => {
    if (object === null || object === undefined) {
      return false;
    }
    if (typeof object !== "object") {
      return false;
    }
    const propertyKey = String(property);
    return Object.prototype.hasOwnProperty.call(object, propertyKey);
  }, 2),
  keys: new BuiltinFunction("keys", ([object], interpreter, callNode) => {
    if (object === null || object === undefined) {
      throw interpreter.errorHandler.createRuntimeError("keys() requires a non-null object.", callNode, "TYPE001", "Provide an object or array to keys().");
    }
    if (typeof object !== "object") {
      throw interpreter.errorHandler.createRuntimeError("keys() requires an object argument.", callNode, "TYPE001", "Provide an object or array to keys().");
    }
    if (Array.isArray(object)) {
      return Object.keys(object).map(Number);
    }
    return Object.keys(object);
  }, 1),
  values: new BuiltinFunction("values", ([object], interpreter, callNode) => {
    if (object === null || object === undefined) {
      throw interpreter.errorHandler.createRuntimeError("values() requires a non-null object.", callNode, "TYPE001", "Provide an object or array to values().");
    }
    if (typeof object !== "object") {
      throw interpreter.errorHandler.createRuntimeError("values() requires an object argument.", callNode, "TYPE001", "Provide an object or array to values().");
    }
    return Object.values(object);
  }, 1),
  entries: new BuiltinFunction("entries", ([object], interpreter, callNode) => {
    if (object === null || object === undefined) {
      throw interpreter.errorHandler.createRuntimeError("entries() requires a non-null object.", callNode, "TYPE001", "Provide an object or array to entries().");
    }
    if (typeof object !== "object") {
      throw interpreter.errorHandler.createRuntimeError("entries() requires an object argument.", callNode, "TYPE001", "Provide an object or array to entries().");
    }
    return Object.entries(object);
  }, 1),
  get_arguments: new BuiltinFunction("get_arguments", (args, interpreter, callNode) => {
    return interpreter.adapter.getArguments();
  }, 0),
  get_env: new BuiltinFunction("get_env", (args, interpreter, callNode) => {
    const [variableName] = args;
    if (typeof variableName !== "string") {
      throw interpreter.errorHandler.createRuntimeError("get_env() expects a string variable name as its argument.", callNode, "TYPE001", "Provide a string environment variable name.");
    }
    if (typeof interpreter.adapter.getEnvVariable !== "function") {
      throw interpreter.errorHandler.createRuntimeError("Host adapter does not support getEnvVariable().", callNode, "ADAPTER001", "Use an adapter that supports environment variables.");
    }
    return interpreter.adapter.getEnvVariable(variableName) ?? null;
  }, 1),
  exit_code: new BuiltinFunction("exit_code", (args, interpreter, callNode) => {
    const [code] = args;
    if (typeof code !== "number") {
      throw interpreter.errorHandler.createRuntimeError("exit_code() expects a numeric exit code as its argument.", callNode, "TYPE001", "Provide a number for the exit code.");
    }
    interpreter.adapter.exit(Math.floor(code));
    return null;
  }, 1),
  coalesce: new BuiltinFunction("coalesce", (args, interpreter, callNode) => {
    const [value, defaultValue] = args;
    if (value === null || value === undefined) {
      return defaultValue;
    }
    return value;
  }, 2),
  get_property_safe: new BuiltinFunction("get_property_safe", ([object, propertyName], interpreter, callNode) => {
    if (object === null || object === undefined) {
      return null;
    }
    if (typeof propertyName !== "string") {
      throw interpreter.errorHandler.createRuntimeError(`get_property_safe() expects a string property name as argument 2. Got '${typeof propertyName}'.`, callNode, "TYPE001", 'Provide a string literal for the property name (e.g., "name").');
    }
    if (typeof object !== "object" && typeof object !== "string" && typeof object !== "function") {
      throw interpreter.errorHandler.createRuntimeError(`Cannot safely access property '${propertyName}' of non-object/non-string value of type '${typeof object}'.`, callNode, "TYPE002", "get_property_safe() is only applicable to objects, functions, or strings.");
    }
    const value = object[propertyName];
    return value === undefined ? null : value;
  }, 2),
  if_else: new BuiltinFunction("if_else", ([condition, consequentValue, alternateValue], interpreter, callNode) => {
    if (interpreter.expressionEvaluator.isTruthy(condition)) {
      return consequentValue;
    } else {
      return alternateValue;
    }
  }, 3)
};
function initializeBuiltins(environment) {
  for (const [name, func] of Object.entries(builtinFunctions)) {
    environment.define(name, func);
  }
}

// ../interpreter/stdlib/array/higherOrderFunctions.js
var arrayMap = new BuiltinFunction("map", (args, interpreter, callNode) => {
  const [arr, callbackFn] = args;
  expectArray(arr, "map", interpreter, callNode, 1);
  expectMimoFunction(callbackFn, "map", interpreter, callNode, 2);
  const result = [];
  for (let i = 0;i < arr.length; i++) {
    const fullArgs = [arr[i], i, arr];
    const callArgs = fullArgs.slice(0, callbackFn.declaration.params.length);
    const mappedValue = callbackFn.call(interpreter, callArgs);
    result.push(mappedValue);
  }
  return result;
}, 2);
var arrayFilter = new BuiltinFunction("filter", (args, interpreter, callNode) => {
  const [arr, callbackFn] = args;
  expectArray(arr, "filter", interpreter, callNode, 1);
  expectMimoFunction(callbackFn, "filter", interpreter, callNode, 2);
  const result = [];
  for (let i = 0;i < arr.length; i++) {
    const fullArgs = [arr[i], i, arr];
    const callArgs = fullArgs.slice(0, callbackFn.declaration.params.length);
    const shouldInclude = callbackFn.call(interpreter, callArgs);
    if (interpreter.expressionEvaluator.isTruthy(shouldInclude)) {
      result.push(arr[i]);
    }
  }
  return result;
}, 2);
var arrayReduce = new BuiltinFunction("reduce", (args, interpreter, callNode) => {
  const [arr, callbackFn, initialValue] = args;
  expectArray(arr, "reduce", interpreter, callNode, 1);
  expectMimoFunction(callbackFn, "reduce", interpreter, callNode, 2);
  if (arr.length === 0 && initialValue === undefined) {
    throw interpreter.errorHandler.createRuntimeError(`reduce() of empty array with no initial value.`, callNode, "ARG001", `Provide an initial value to reduce() when operating on an empty array.`);
  }
  let accumulator = initialValue;
  let startIndex = 0;
  if (initialValue === undefined) {
    accumulator = arr[0];
    startIndex = 1;
  }
  for (let i = startIndex;i < arr.length; i++) {
    const fullArgs = [accumulator, arr[i], i, arr];
    const callArgs = fullArgs.slice(0, callbackFn.declaration.params.length);
    accumulator = callbackFn.call(interpreter, callArgs);
  }
  return accumulator;
}, [2, 3]);
var arrayForEach = new BuiltinFunction("for_each", (args, interpreter, callNode) => {
  const [arr, callbackFn] = args;
  expectArray(arr, "for_each", interpreter, callNode, 1);
  expectMimoFunction(callbackFn, "for_each", interpreter, callNode, 2);
  for (let i = 0;i < arr.length; i++) {
    const fullArgs = [arr[i], i, arr];
    const callArgs = fullArgs.slice(0, callbackFn.declaration.params.length);
    callbackFn.call(interpreter, callArgs);
  }
  return null;
}, 2);
var arrayFind = new BuiltinFunction("find", (args, interpreter, callNode) => {
  const [arr, callbackFn] = args;
  expectArray(arr, "find", interpreter, callNode, 1);
  expectMimoFunction(callbackFn, "find", interpreter, callNode, 2);
  for (let i = 0;i < arr.length; i++) {
    const fullArgs = [arr[i], i, arr];
    const callArgs = fullArgs.slice(0, callbackFn.declaration.params.length);
    const isMatch = callbackFn.call(interpreter, callArgs);
    if (interpreter.expressionEvaluator.isTruthy(isMatch)) {
      return arr[i];
    }
  }
  return null;
}, 2);
var arrayFindIndex = new BuiltinFunction("find_index", (args, interpreter, callNode) => {
  const [arr, callbackFn] = args;
  expectArray(arr, "find_index", interpreter, callNode, 1);
  expectMimoFunction(callbackFn, "find_index", interpreter, callNode, 2);
  for (let i = 0;i < arr.length; i++) {
    const fullArgs = [arr[i], i, arr];
    const callArgs = fullArgs.slice(0, callbackFn.declaration.params.length);
    const isMatch = callbackFn.call(interpreter, callArgs);
    if (interpreter.expressionEvaluator.isTruthy(isMatch)) {
      return i;
    }
  }
  return -1;
}, 2);

// ../interpreter/stdlib/array/searchFunctions.js
var arrayIncludes = new BuiltinFunction("includes", (args, interpreter, callNode) => {
  const [arr, valueToFind, fromIndexArg] = args;
  expectArray(arr, "includes", interpreter, callNode, 1);
  let fromIndex = 0;
  if (fromIndexArg !== undefined) {
    if (typeof fromIndexArg !== "number") {
      throw interpreter.errorHandler.createRuntimeError(`includes() fromIndex (arg 3) must be a number.`, callNode, "ARG001", `Provide a number for the fromIndex parameter.`);
    }
    fromIndex = fromIndexArg;
  }
  if (fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex);
  }
  for (let i = fromIndex;i < arr.length; i++) {
    const currentValue = arr[i];
    if (Number.isNaN(valueToFind) && Number.isNaN(currentValue)) {
      return true;
    }
    if (currentValue === valueToFind) {
      return true;
    }
  }
  return false;
}, [2, 3]);
var arrayIndexOf = new BuiltinFunction("index_of", (args, interpreter, callNode) => {
  const [arr, valueToFind, fromIndexArg] = args;
  expectArray(arr, "index_of", interpreter, callNode, 1);
  let fromIndex = 0;
  if (fromIndexArg !== undefined) {
    expectNumber(fromIndexArg, "index_of", interpreter, callNode, 3);
    fromIndex = fromIndexArg;
  }
  return arr.indexOf(valueToFind, fromIndex);
}, [2, 3]);
var arrayLastIndexOf = new BuiltinFunction("last_index_of", (args, interpreter, callNode) => {
  const [arr, valueToFind, fromIndexArg] = args;
  expectArray(arr, "last_index_of", interpreter, callNode, 1);
  let fromIndex = arr.length - 1;
  if (fromIndexArg !== undefined) {
    expectNumber(fromIndexArg, "last_index_of", interpreter, callNode, 3);
    fromIndex = fromIndexArg;
  }
  return arr.lastIndexOf(valueToFind, fromIndex);
}, [2, 3]);

// ../interpreter/stdlib/array/transformationFunctions.js
var arraySort = new BuiltinFunction("sort", (args, interpreter, callNode) => {
  const [arr] = args;
  expectArray(arr, "sort", interpreter, callNode, 1);
  const newArray = [...arr];
  const allNumbers = newArray.every((item) => typeof item === "number");
  const allStrings = newArray.every((item) => typeof item === "string");
  if (allNumbers) {
    newArray.sort((a, b) => a - b);
  } else if (allStrings) {
    newArray.sort();
  } else {
    newArray.sort((a, b) => String(a).localeCompare(String(b)));
  }
  return newArray;
}, 1);
var arrayReverse = new BuiltinFunction("reverse", (args, interpreter, callNode) => {
  const [arr] = args;
  expectArray(arr, "reverse", interpreter, callNode, 1);
  const newArray = [...arr];
  return newArray.reverse();
}, 1);
var arrayShuffle = new BuiltinFunction("shuffle", (args, interpreter, callNode) => {
  const [arr] = args;
  expectArray(arr, "shuffle", interpreter, callNode, 1);
  const newArray = [...arr];
  for (let i = newArray.length - 1;i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}, 1);
var arrayConcat = new BuiltinFunction("concat", (args, interpreter, callNode) => {
  if (args.length === 0) {
    return [];
  }
  let resultArray = [];
  for (let i = 0;i < args.length; i++) {
    const currentArg = args[i];
    expectArray(currentArg, "concat", interpreter, callNode, i + 1);
    resultArray = resultArray.concat(currentArg);
  }
  return resultArray;
}, [1, Infinity]);

// ../interpreter/stdlib/array/setFunctions.js
var arrayUnique = new BuiltinFunction("unique", (args, interpreter, callNode) => {
  const [arr] = args;
  expectArray(arr, "unique", interpreter, callNode, 1);
  return [...new Set(arr)];
}, 1);
var arrayIntersection = new BuiltinFunction("intersection", (args, interpreter, callNode) => {
  const [arr1, arr2] = args;
  expectArray(arr1, "intersection", interpreter, callNode, 1);
  expectArray(arr2, "intersection", interpreter, callNode, 2);
  const set2 = new Set(arr2);
  return arr1.filter((item) => set2.has(item));
}, 2);
var arrayUnion = new BuiltinFunction("union", (args, interpreter, callNode) => {
  const [arr1, arr2] = args;
  expectArray(arr1, "union", interpreter, callNode, 1);
  expectArray(arr2, "union", interpreter, callNode, 2);
  return [...new Set([...arr1, ...arr2])];
}, 2);
var arrayDifference = new BuiltinFunction("difference", (args, interpreter, callNode) => {
  const [arr1, arr2] = args;
  expectArray(arr1, "difference", interpreter, callNode, 1);
  expectArray(arr2, "difference", interpreter, callNode, 2);
  const set2 = new Set(arr2);
  return arr1.filter((item) => !set2.has(item));
}, 2);

// ../interpreter/stdlib/array.js
var arrayModule = {
  map: arrayMap,
  filter: arrayFilter,
  reduce: arrayReduce,
  for_each: arrayForEach,
  find: arrayFind,
  find_index: arrayFindIndex,
  includes: arrayIncludes,
  index_of: arrayIndexOf,
  last_index_of: arrayLastIndexOf,
  slice: arraySlice,
  first: arrayFirst,
  last: arrayLast,
  is_empty: arrayIsEmpty,
  sort: arraySort,
  reverse: arrayReverse,
  shuffle: arrayShuffle,
  concat: arrayConcat,
  unique: arrayUnique,
  intersection: arrayIntersection,
  union: arrayUnion,
  difference: arrayDifference
};
function initializeArrayModule(environment) {
  const arrayModuleObject = {};
  for (const [name, func] of Object.entries(arrayModule)) {
    arrayModuleObject[name] = func;
  }
  environment.define("Array", arrayModuleObject);
}

// ../interpreter/MimoError.js
class MimoError extends Error {
  constructor(type, code, message, suggestion = "", location = {}, stackFrames = []) {
    super(message);
    this.name = type;
    this.type = type;
    this.code = code;
    this.suggestion = suggestion;
    this.location = {
      file: location.file || "unknown",
      line: location.line,
      column: location.column,
      start: location.start,
      length: location.length,
      snippet: location.snippet
    };
    this.stackFrames = stackFrames;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack;
    }
  }
  static lexerError(code, message, token, suggestion) {
    const location = token ? {
      line: token.line,
      column: token.column,
      start: token.start,
      length: token.length,
      file: token.file
    } : {};
    return new MimoError("LexerError", code, message, suggestion, location);
  }
  static syntaxError(code, message, astNodeOrToken, suggestion) {
    const location = astNodeOrToken ? {
      line: astNodeOrToken.line,
      column: astNodeOrToken.column,
      start: astNodeOrToken.start,
      length: astNodeOrToken.length,
      file: astNodeOrToken.file
    } : {};
    return new MimoError("SyntaxError", code, message, suggestion, location);
  }
  static runtimeError(code, message, astNode, suggestion, stackFrames) {
    const location = astNode ? {
      line: astNode.line,
      column: astNode.column,
      start: astNode.start,
      length: astNode.length,
      file: astNode.file
    } : {};
    return new MimoError("RuntimeError", code, message, suggestion, location, stackFrames);
  }
  format(sourceCodeLine = "") {
    let output = `[${this.type} ${this.code}]: ${this.message}
`;
    if (this.location.file) {
      output += `    at ${this.location.file}:${this.location.line}:${this.location.column}
`;
    } else if (this.location.line !== undefined && this.location.column !== undefined) {
      output += `    at Line ${this.location.line}, Col ${this.location.column}
`;
    }
    if (sourceCodeLine) {
      output += `> ${sourceCodeLine.trim()}
`;
      if (this.location.column !== undefined && sourceCodeLine.trim().length > 0) {
        const trimmedOffset = sourceCodeLine.length - sourceCodeLine.trimStart().length;
        const pointerCol = Math.max(0, this.location.column - 1 - trimmedOffset);
        output += `  ${" ".repeat(pointerCol)}^
`;
      }
    }
    if (this.suggestion) {
      output += `Suggestion: ${this.suggestion}
`;
    }
    if (this.stackFrames && this.stackFrames.length > 0) {
      output += `Mimo Stack:
`;
      this.stackFrames.forEach((frame) => {
        output += `    at ${frame.functionName} (${frame.file || "unknown"}:${frame.line}:${frame.column})
`;
      });
    }
    return output;
  }
}

// ../interpreter/ErrorHandler.js
class ErrorHandler {
  constructor(sourceCodeMap = {}) {
    this.sourceCodeMap = sourceCodeMap;
  }
  addSourceFile(filePath, sourceCode) {
    this.sourceCodeMap[filePath] = sourceCode;
  }
  clearSourceFile(filePath) {
    delete this.sourceCodeMap[filePath];
  }
  getLine(filePath, lineNumber) {
    const source = this.sourceCodeMap[filePath];
    if (!source)
      return "";
    const lines = source.split(`
`);
    if (lineNumber > 0 && lineNumber <= lines.length) {
      return lines[lineNumber - 1];
    }
    return "";
  }
  createLexerError(message, token, code = "LEX000", suggestion = "") {
    const error = MimoError.lexerError(code, message, token, suggestion);
    error.location.file = token.file || "unknown";
    error.location.snippet = this.getLine(error.location.file, error.location.line);
    return error;
  }
  createSyntaxError(message, astNodeOrToken, code = "SYN000", suggestion = "") {
    const error = MimoError.syntaxError(code, message, astNodeOrToken, suggestion);
    error.location.file = astNodeOrToken.file || "unknown";
    error.location.snippet = this.getLine(error.location.file, error.location.line);
    return error;
  }
  createRuntimeError(message, astNode, code = "RUN000", suggestion = "", stackFrames = []) {
    const error = MimoError.runtimeError(code, message, astNode, suggestion, stackFrames);
    error.location.file = astNode?.file || "unknown";
    error.location.snippet = this.getLine(error.location.file, error.location.line);
    return error;
  }
  printError(error) {
    if (error instanceof MimoError) {
      console.error(error.format(error.location.snippet));
    } else {
      console.error(`An unexpected error occurred: ${error.message}`);
      console.error(error.stack);
    }
  }
}

// ../interpreter/evaluators/binaryExpressionEvaluator.js
function evaluateBinaryExpression(interpreter, node) {
  const left = interpreter.visitNode(node.left);
  const right = interpreter.visitNode(node.right);
  const isNumericOp = ["+", "-", "*", "/", "%", "<", ">", "<=", ">="].includes(node.operator);
  if (isNumericOp && (typeof left !== "number" || typeof right !== "number")) {
    if (node.operator === "+" && (typeof left === "string" || typeof right === "string")) {
      return String(left) + String(right);
    }
    throw interpreter.errorHandler.createRuntimeError(`Operator '${node.operator}' expects numbers. Got '${typeof left}' and '${typeof right}'.`, node, "TYPE001", `Ensure both operands for '${node.operator}' are numbers.`);
  }
  switch (node.operator) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      if (right === 0) {
        throw interpreter.errorHandler.createRuntimeError("Division by zero is not allowed.", node, "MATH001", "Ensure the divisor is not zero.");
      }
      return left / right;
    case "%":
      if (right === 0) {
        throw interpreter.errorHandler.createRuntimeError("Modulo by zero is not allowed.", node, "MATH001", "Ensure the divisor is not zero.");
      }
      return left % right;
    case ">":
      return left > right;
    case "<":
      return left < right;
    case ">=":
      return left >= right;
    case "<=":
      return left <= right;
    case "=":
    case "==":
      return left === right;
    case "===":
      return left === right;
    case "!":
    case "!=":
      return left !== right;
    case "!==":
      return left !== right;
    case "and":
    case "&&":
      return isTruthy(left) && isTruthy(right);
    case "or":
    case "||":
      return isTruthy(left) || isTruthy(right);
    default:
      throw interpreter.errorHandler.createRuntimeError(`Unknown binary operator: '${node.operator}'.`, node, "OP001", "Check for typos in the operator.");
  }
}
function evaluateUnaryExpression(interpreter, node) {
  const argument = interpreter.visitNode(node.argument);
  switch (node.operator) {
    case "-":
      if (typeof argument !== "number") {
        throw interpreter.errorHandler.createRuntimeError(`Unary minus expects a number. Got '${typeof argument}'.`, node, "TYPE001", "Provide a number for unary minus operation.");
      }
      return -argument;
    case "not":
      return !isTruthy(argument);
    default:
      throw interpreter.errorHandler.createRuntimeError(`Unknown unary operator: '${node.operator}'.`, node, "OP001", "Check for typos in the operator.");
  }
}

// ../interpreter/evaluators/literalEvaluator.js
function evaluateIdentifier(interpreter, node) {
  return interpreter.currentEnv.lookup(node.name);
}
function evaluateLiteral(interpreter, node) {
  return node.value;
}

// ../interpreter/evaluators/collectionEvaluator.js
function evaluateArrayLiteral(interpreter, node) {
  const result = [];
  for (const element of node.elements) {
    if (element.type === "SpreadElement") {
      const spreadValue = interpreter.visitNode(element.argument);
      if (!Array.isArray(spreadValue)) {
        throw interpreter.errorHandler.createRuntimeError(`Cannot spread non-array value of type '${typeof spreadValue}'.`, element, "TYPE001", 'Spread operator "..." can only be used with arrays.');
      }
      result.push(...spreadValue);
    } else {
      result.push(interpreter.visitNode(element));
    }
  }
  return result;
}
function evaluateArrayAccess(interpreter, node) {
  const object = interpreter.visitNode(node.object);
  const index = interpreter.visitNode(node.index);
  if (Array.isArray(object)) {
    if (typeof index !== "number" || !Number.isInteger(index)) {
      throw interpreter.errorHandler.createRuntimeError(`Array index must be an integer. Got type '${typeof index}'.`, node.index, "TYPE001", "Provide an integer for array indexing.");
    }
    return index < 0 || index >= object.length ? null : object[index];
  }
  if (typeof object === "object" && object !== null) {
    const key = String(index);
    return Object.prototype.hasOwnProperty.call(object, key) ? object[key] : null;
  }
  if (typeof object === "string") {
    if (typeof index !== "number" || !Number.isInteger(index)) {
      throw interpreter.errorHandler.createRuntimeError(`String index must be an integer. Got type '${typeof index}'.`, node.index, "TYPE001", "Provide an integer for string character access.");
    }
    return index < 0 || index >= object.length ? null : object.charAt(index);
  }
  throw interpreter.errorHandler.createRuntimeError(`Cannot access property on value of type '${typeof object}'. Only arrays, objects, and strings can be indexed.`, node.object, "TYPE002", "Ensure you are using bracket notation on a valid collection type.");
}
function evaluateObjectLiteral(interpreter, node) {
  const obj = {};
  for (const prop of node.properties) {
    const value = interpreter.visitNode(prop.value);
    obj[prop.key] = value;
  }
  return obj;
}
function evaluatePropertyAccess(interpreter, node) {
  const object = interpreter.visitNode(node.object);
  if (object === null || object === undefined) {
    throw interpreter.errorHandler.createRuntimeError(`Cannot access property '${node.property}' of 'null'.`, node.object, "REF001", "Ensure the object is not null or undefined before accessing its properties. Consider using safe navigation (?. ).");
  }
  if (typeof object !== "object" && typeof object !== "string") {
    throw interpreter.errorHandler.createRuntimeError(`Cannot access property '${node.property}' of non-object value of type '${typeof object}'.`, node.object, "TYPE002", "Properties can only be accessed on objects or strings.");
  }
  return object[node.property];
}
function evaluateSafePropertyAccess(interpreter, node) {
  const object = interpreter.visitNode(node.object);
  if (object === null || object === undefined) {
    return null;
  }
  return evaluatePropertyAccess(interpreter, { ...node, type: "PropertyAccess" });
}

// ../interpreter/evaluators/functionCallEvaluator.js
function evaluateAnonymousFunction(interpreter, node) {
  return new FunctionValue(node, interpreter.currentEnv);
}
function evaluateCallExpression(interpreter, node) {
  let func;
  let functionName;
  if (typeof node.callee === "string") {
    func = interpreter.currentEnv.lookup(node.callee);
    functionName = node.callee;
  } else {
    func = interpreter.visitNode(node.callee);
    if (node.callee.type === "ModuleAccess") {
      functionName = `${node.callee.module}.${node.callee.property}`;
    } else if (node.callee.type === "Identifier") {
      functionName = node.callee.name;
    } else {
      functionName = "<anonymous function>";
    }
  }
  if (!(func instanceof FunctionValue) && !(func instanceof BuiltinFunction)) {
    throw interpreter.errorHandler.createRuntimeError(`'${functionName}' is not a callable function.`, node, "TYPE002", "Ensure you are calling a function or method.");
  }
  const args = node.arguments.map((arg) => interpreter.visitNode(arg));
  const result = func.call(interpreter, args, node);
  return result;
}

// ../interpreter/evaluators/templateLiteralEvaluator.js
function evaluateTemplateLiteral(interpreter, node) {
  let resultString = "";
  for (const part of node.parts) {
    if (part.type === "Literal") {
      resultString += part.value;
    } else {
      const value = interpreter.visitNode(part);
      resultString += stringify(value);
    }
  }
  return resultString;
}

// ../interpreter/evaluators/moduleAccessEvaluator.js
function evaluateModuleAccess(interpreter, node) {
  const moduleObject = interpreter.currentEnv.lookup(node.module);
  if (typeof moduleObject !== "object" || moduleObject === null) {
    throw interpreter.errorHandler.createRuntimeError(`Cannot access property on non-module/non-object '${node.module}'.`, node.module, "TYPE002");
  }
  if (!Object.prototype.hasOwnProperty.call(moduleObject, node.property)) {
    const availableProps = Object.keys(moduleObject).sort();
    throw interpreter.errorHandler.createRuntimeError(`Property '${node.property}' not found in module '${node.module}'.`, node, "MOD002", `Available properties in '${node.module}': ${availableProps.join(", ")}`);
  }
  return moduleObject[node.property];
}

// ../interpreter/ExpressionEvaluator.js
class ExpressionEvaluator {
  constructor(interpreter) {
    this.interpreter = interpreter;
  }
  evaluateExpression(node) {
    switch (node.type) {
      case "BinaryExpression":
        return evaluateBinaryExpression(this.interpreter, node);
      case "UnaryExpression":
        return evaluateUnaryExpression(this.interpreter, node);
      case "Identifier":
        return evaluateIdentifier(this.interpreter, node);
      case "Literal":
        return evaluateLiteral(this.interpreter, node);
      case "ArrayLiteral":
        return evaluateArrayLiteral(this.interpreter, node);
      case "ObjectLiteral":
        return evaluateObjectLiteral(this.interpreter, node);
      case "PropertyAccess":
        return evaluatePropertyAccess(this.interpreter, node);
      case "SafePropertyAccess":
        return evaluateSafePropertyAccess(this.interpreter, node);
      case "ArrayAccess":
        return evaluateArrayAccess(this.interpreter, node);
      case "ModuleAccess":
        return evaluateModuleAccess(this.interpreter, node);
      case "AnonymousFunction":
        return evaluateAnonymousFunction(this.interpreter, node);
      case "TemplateLiteral":
        return evaluateTemplateLiteral(this.interpreter, node);
      case "CallExpression":
        return evaluateCallExpression(this.interpreter, node);
      default:
        throw new Error(`Unknown expression type: ${node.type}`);
    }
  }
  isTruthy(value) {
    if (value === false || value === 0 || value === "" || value === null || value === undefined) {
      return false;
    }
    return true;
  }
}

// ../lexer/TokenTypes.js
var TokenType = {
  Keyword: "keyword",
  Identifier: "identifier",
  Number: "number",
  String: "string",
  Boolean: "boolean",
  Null: "null",
  Operator: "operator",
  LParen: "lparen",
  RParen: "rparen",
  LBracket: "lbracket",
  RBracket: "rbracket",
  LBrace: "lbrace",
  RBrace: "rbrace",
  Comma: "comma",
  Range: "range",
  Slice: "slice",
  Spread: "spread",
  Backtick: "backtick",
  StringFragment: "string_fragment",
  InterpolationStart: "interpolation_start",
  InterpolationEnd: "interpolation_end",
  Colon: "colon"
};
var END_KEYWORDS = [
  "end",
  "else"
];
var KEYWORDS = [
  "set",
  "let",
  "const",
  "global",
  "destructure",
  "from",
  "if",
  "while",
  "function",
  "call",
  "show",
  "return",
  "try",
  "catch",
  "throw",
  "for",
  "in",
  "match",
  "case",
  "default",
  "break",
  "continue",
  "loop",
  "true",
  "false",
  "null",
  "import",
  "as",
  "export",
  ...END_KEYWORDS
];
var Keywords = {
  set: TokenType.Keyword,
  let: TokenType.Keyword,
  const: TokenType.Keyword,
  global: TokenType.Keyword,
  if: TokenType.If,
  while: TokenType.Keyword,
  function: TokenType.Keyword,
  call: TokenType.Keyword,
  show: TokenType.Keyword,
  return: TokenType.Keyword,
  try: TokenType.Keyword,
  catch: TokenType.Keyword,
  throw: TokenType.Keyword,
  for: TokenType.Keyword,
  in: TokenType.Keyword,
  match: TokenType.Keyword,
  case: TokenType.Keyword,
  default: TokenType.Keyword,
  break: TokenType.Keyword,
  continue: TokenType.Keyword,
  loop: TokenType.Keyword,
  true: TokenType.True,
  false: TokenType.False,
  null: TokenType.Null,
  import: TokenType.Import,
  export: TokenType.Export
};
var Operators = {
  "+": TokenType.Plus,
  "-": TokenType.Minus,
  "=": TokenType.Equal,
  "==": TokenType.EqualEqual,
  "===": TokenType.EqualEqualEqual,
  "!=": TokenType.BangEqual,
  "!==": TokenType.BangEqualEqual,
  ">": TokenType.Greater,
  "<": TokenType.Less,
  ">=": TokenType.GreaterEqual,
  "<=": TokenType.LessEqual,
  "&&": TokenType.And,
  "||": TokenType.Or
};

// ../lexer/createToken.js
function createToken(type, value, line, column, start, length, file = "unknown") {
  return {
    type,
    value,
    line,
    column,
    start,
    length,
    file
  };
}

// ../lexer/tokenizers/commentTokenizer.js
function skipSingleLineComment(lexer) {
  lexer.advance();
  lexer.advance();
  while (!lexer.isAtEnd() && lexer.peek() !== `
`) {
    lexer.advance();
  }
}
function skipMultiLineComment(lexer) {
  lexer.advance();
  lexer.advance();
  while (!lexer.isAtEnd()) {
    if (lexer.peek() === "*" && lexer.peek(1) === "/") {
      lexer.advance();
      lexer.advance();
      break;
    }
    lexer.advance();
  }
}
function skipComments(lexer) {
  while (!lexer.isAtEnd()) {
    const char = lexer.peek();
    if (char === "/" && lexer.peek(1) === "/") {
      skipSingleLineComment(lexer);
    } else if (char === "/" && lexer.peek(1) === "*") {
      skipMultiLineComment(lexer);
    } else {
      break;
    }
  }
}

// ../lexer/tokenizers/whitespaceTokenizer.js
function skipWhitespace(lexer) {
  while (!lexer.isAtEnd()) {
    const char = lexer.peek();
    if (char === " " || char === "\t") {
      lexer.advance();
    } else if (char === `
`) {
      lexer.advance();
    } else if (char === "/" && (lexer.peek(1) === "/" || lexer.peek(1) === "*")) {
      skipComments(lexer);
    } else {
      break;
    }
  }
}

// ../lexer/tokenizers/literalTokenizer.js
function readIdentifier(lexer) {
  const startLine = lexer.line;
  const startColumn = lexer.column;
  const startPosition = lexer.position;
  let value = "";
  while (!lexer.isAtEnd() && isAlphaNumeric(lexer.peek())) {
    value += lexer.peek();
    lexer.advance();
  }
  const length = value.length;
  if (value === "true") {
    return lexer._createToken(TokenType.Boolean, true, startLine, startColumn, startPosition, length);
  }
  if (value === "false") {
    return lexer._createToken(TokenType.Boolean, false, startLine, startColumn, startPosition, length);
  }
  if (value === "null") {
    return lexer._createToken(TokenType.Null, null, startLine, startColumn, startPosition, length);
  }
  if (KEYWORDS.includes(value)) {
    return lexer._createToken(TokenType.Keyword, value, startLine, startColumn, startPosition, length);
  }
  return lexer._createToken(TokenType.Identifier, value, startLine, startColumn, startPosition, length);
}
function readNumber(lexer) {
  const startLine = lexer.line;
  const startCol = lexer.column;
  const startPosition = lexer.position;
  let value = "";
  let hasDecimal = false;
  let hasExponent = false;
  while (!lexer.isAtEnd()) {
    const char = lexer.peek();
    if (isDigit(char)) {
      value += char;
    } else if (char === "." && !hasDecimal && !hasExponent && isDigit(lexer.peek(1))) {
      value += char;
      hasDecimal = true;
    } else if ((char === "e" || char === "E") && !hasExponent) {
      const nextChar = lexer.peek(1);
      if (nextChar === "+" || nextChar === "-" || isDigit(nextChar)) {
        value += char;
        lexer.advance();
        if (nextChar === "+" || nextChar === "-") {
          value += nextChar;
          lexer.advance();
        }
        while (!lexer.isAtEnd() && isDigit(lexer.peek())) {
          value += lexer.peek();
          lexer.advance();
        }
        hasExponent = true;
        break;
      } else {
        break;
      }
    } else {
      break;
    }
    lexer.advance();
  }
  return lexer._createToken(TokenType.Number, parseFloat(value), startLine, startCol, startPosition, value.length);
}
function readString(lexer) {
  const startLine = lexer.line;
  const startCol = lexer.column;
  const startPos = lexer.position;
  const quote = lexer.peek();
  lexer.advance();
  let value = "";
  while (!lexer.isAtEnd()) {
    const char = lexer.peek();
    if (char === quote) {
      lexer.advance();
      const tokenLength = lexer.position - startPos;
      return lexer._createToken(TokenType.String, value, startLine, startCol, startPos, tokenLength);
    }
    if (char === `
`) {
      lexer.error("Unterminated string literal. Newline encountered.", "LEX004", "String literals must be closed on the same line or use '\\n' for a newline character.");
    }
    if (char === "\\") {
      lexer.advance();
      if (lexer.isAtEnd()) {
        lexer.error("Unterminated escape sequence at end of file.", "LEX005");
      }
      const escapedChar = lexer.peek();
      switch (escapedChar) {
        case "n":
          value += `
`;
          break;
        case "t":
          value += "\t";
          break;
        case "r":
          value += "\r";
          break;
        case "\\":
          value += "\\";
          break;
        case '"':
          value += '"';
          break;
        default:
          lexer.error(`Invalid escape sequence: \\${escapedChar}`, "LEX003");
      }
    } else {
      value += char;
    }
    lexer.advance();
  }
  lexer.error("Unterminated string literal.", "LEX005", `A string starting with ${quote} was not properly closed.`);
}
function isAlpha(char) {
  return /^[a-zA-Z_]$/.test(char);
}
function isAlphaNumeric(char) {
  return /^[a-zA-Z0-9_]$/.test(char);
}
function isDigit(char) {
  return /^[0-9]$/.test(char);
}

// ../lexer/tokenizers/symbolTokenizer.js
var SYMBOLS = {
  "(": TokenType.LParen,
  ")": TokenType.RParen,
  "[": TokenType.LBracket,
  "]": TokenType.RBracket,
  "{": TokenType.LBrace,
  "}": TokenType.RBrace,
  ",": TokenType.Comma,
  "?.": TokenType.Operator,
  ".": TokenType.Operator,
  "+": TokenType.Operator,
  "-": TokenType.Operator,
  "*": TokenType.Operator,
  "/": TokenType.Operator,
  "%": TokenType.Operator,
  ">": TokenType.Operator,
  "<": TokenType.Operator,
  "=": TokenType.Operator,
  "==": TokenType.Operator,
  "===": TokenType.Operator,
  "!": TokenType.Operator,
  "!=": TokenType.Operator,
  "!==": TokenType.Operator,
  ">=": TokenType.Operator,
  "<=": TokenType.Operator,
  "&&": TokenType.Operator,
  "||": TokenType.Operator,
  "->": TokenType.Operator,
  "...": TokenType.Spread,
  "..": TokenType.Range,
  ":": TokenType.Colon
};
function readSymbol(lexer) {
  const startLine = lexer.line;
  const startColumn = lexer.column;
  const startPosition = lexer.position;
  const sortedSymbols = Object.keys(SYMBOLS).sort((a, b) => b.length - a.length);
  for (const symbolString of sortedSymbols) {
    if (lexer.source.startsWith(symbolString, lexer.position)) {
      for (let i = 0;i < symbolString.length; i++) {
        lexer.advance();
      }
      const tokenLength = symbolString.length;
      return lexer._createToken(SYMBOLS[symbolString], symbolString, startLine, startColumn, startPosition, tokenLength);
    }
  }
  const char = lexer.peek();
  lexer.error(`Unrecognized symbol or character: '${char}'.`, "LEX007", `The symbol or character '${char}' is not recognized. Check for typos or unsupported operators.`);
}

// ../lexer/Lexer.js
class Lexer {
  constructor(source, filePath = "unknown") {
    this.source = source;
    this.filePath = filePath;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.previousToken = null;
    this.templateLiteralState = 0;
    this.templateLiteralDepth = 0;
  }
  isAtEnd() {
    return this.position >= this.source.length;
  }
  peek(offset = 0) {
    return this.position + offset < this.source.length ? this.source[this.position + offset] : null;
  }
  advance() {
    if (!this.isAtEnd()) {
      const char = this.source[this.position];
      if (char === `
`) {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.position++;
    }
  }
  _createToken(type, value, startLine, startColumn, startPosition, length) {
    return createToken(type, value, startLine, startColumn, startPosition, length, this.filePath);
  }
  error(message, code = "LEX000", suggestion = "") {
    const errorToken = {
      value: this.peek() || this.source.substring(this.position - 1, this.position) || "",
      line: this.line,
      column: this.column,
      start: this.position,
      length: 1,
      file: this.filePath
    };
    throw MimoError.lexerError(code, message, errorToken, suggestion);
  }
  nextToken() {
    const startLine = this.line;
    const startColumn = this.column;
    const startPosition = this.position;
    skipWhitespace(this);
    if (this.isAtEnd())
      return null;
    const char = this.peek();
    if (this.templateLiteralState === 1 || this.templateLiteralState === 3) {
      if (this.peek() === "`") {
        this.advance();
        this.templateLiteralState = 0;
        this.templateLiteralDepth--;
        return this._createToken(TokenType.Backtick, "`", startLine, startColumn, startPosition, 1);
      }
      if (this.peek() === "$" && this.peek(1) === "{") {
        this.advance();
        this.advance();
        this.templateLiteralState = 2;
        return this._createToken(TokenType.InterpolationStart, "${", startLine, startColumn, startPosition, 2);
      }
      let fragment = "";
      while (!this.isAtEnd() && this.peek() !== "`" && !(this.peek() === "$" && this.peek(1) === "{")) {
        const currentFragmentChar = this.peek();
        if (currentFragmentChar === "\\") {
          this.advance();
          if (this.isAtEnd()) {
            this.error("Unterminated escape sequence in template fragment.", "LEX004", "Complete the escape sequence or close the template literal.");
          }
          const escapedChar = this.peek();
          switch (escapedChar) {
            case "n":
              fragment += `
`;
              break;
            case "t":
              fragment += "\t";
              break;
            case "r":
              fragment += "\r";
              break;
            case "\\":
              fragment += "\\";
              break;
            case "`":
              fragment += "`";
              break;
            case "$":
              fragment += "$";
              break;
            case "{":
              fragment += "{";
              break;
            default:
              this.error(`Unrecognized escape sequence in template: '\\${escapedChar}'.`, "LEX005", "Use valid escape sequences like '\\n', '\\t', '\\\\', '\\`', '\\$'.");
          }
          this.advance();
        } else if (currentFragmentChar === `
`) {
          fragment += currentFragmentChar;
          this.advance();
        } else {
          fragment += currentFragmentChar;
          this.advance();
        }
      }
      if (fragment.length > 0) {
        return this._createToken(TokenType.StringFragment, fragment, startLine, startColumn, startPosition, this.position - startPosition);
      }
    }
    if (char === "`") {
      this.advance();
      this.templateLiteralState = 1;
      this.templateLiteralDepth++;
      return this._createToken(TokenType.Backtick, "`", startLine, startColumn, startPosition, 1);
    }
    if (this.templateLiteralState === 2 && char === "}") {
      this.advance();
      this.templateLiteralState = 3;
      return this._createToken(TokenType.InterpolationEnd, "}", startLine, startColumn, startPosition, 1);
    }
    let token;
    if (isAlpha(char)) {
      token = readIdentifier(this);
    } else if (isDigit(char)) {
      token = readNumber(this);
    } else if (char === '"') {
      token = readString(this);
    } else {
      token = readSymbol(this);
    }
    return token;
  }
}

// ../parser/ASTNodes.js
var ASTNode = {
  Program: (body, firstToken) => ({
    type: "Program",
    body,
    line: firstToken.line,
    column: firstToken.column,
    start: firstToken.start,
    length: firstToken.length,
    file: firstToken.file
  }),
  VariableDeclaration: (identifier, value, kind, isExported, token) => ({
    type: "VariableDeclaration",
    identifier,
    value,
    kind,
    isExported,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  BinaryExpression: (operator, left, right, token) => ({
    type: "BinaryExpression",
    operator,
    left,
    right,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  UnaryExpression: (operator, argument, token) => ({
    type: "UnaryExpression",
    operator,
    argument,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  IfStatement: (condition, consequent, alternate, token) => ({
    type: "IfStatement",
    condition,
    consequent,
    alternate,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  WhileStatement: (condition, body, token) => ({
    type: "WhileStatement",
    condition,
    body,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  ForStatement: (variable, iterable, body, token) => ({
    type: "ForStatement",
    variable,
    iterable,
    body,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  RangeLiteral: (start, end, token) => ({
    type: "RangeLiteral",
    start,
    end,
    line: token.line,
    column: token.column,
    length: token.length,
    file: token.file
  }),
  TryStatement: (tryBlock, catchVar, catchBlock, token) => ({
    type: "TryStatement",
    tryBlock,
    catchVar,
    catchBlock,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  ThrowStatement: (argument, token) => ({
    type: "ThrowStatement",
    argument,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  FunctionDeclaration: (name, params, defaults, restParam, body, isExported, token) => ({
    type: "FunctionDeclaration",
    name,
    params,
    defaults,
    restParam,
    body,
    isExported,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  AnonymousFunction: (params, defaults, restParam, body, token) => ({
    type: "AnonymousFunction",
    params,
    defaults,
    restParam,
    body,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  CallStatement: (callee, args, destination, token) => ({
    type: "CallStatement",
    callee,
    arguments: args,
    destination,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  CallExpression: (callee, args, token) => ({
    type: "CallExpression",
    callee,
    arguments: args,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  ShowStatement: (expression, token) => ({
    type: "ShowStatement",
    expression,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  ReturnStatement: (argument, token) => ({
    type: "ReturnStatement",
    argument,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  Identifier: (name, token) => ({
    type: "Identifier",
    name,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  Literal: (value, token) => ({
    type: "Literal",
    value,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  ArrayLiteral: (elements, token) => ({
    type: "ArrayLiteral",
    elements,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  ObjectLiteral: (properties, token) => ({
    type: "ObjectLiteral",
    properties,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  ArrayAccess: (object, index, token) => ({
    type: "ArrayAccess",
    object,
    index,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  PropertyAccess: (object, property, token) => ({
    type: "PropertyAccess",
    object,
    property,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  SafePropertyAccess: (object, property, token) => ({
    type: "SafePropertyAccess",
    object,
    property,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  PropertyAssignment: (object, property, value, token) => ({
    type: "PropertyAssignment",
    object,
    property,
    value,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  BracketAssignment: (object, index, value, token) => ({
    type: "BracketAssignment",
    object,
    index,
    value,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  SpreadElement: (argument, token) => ({
    type: "SpreadElement",
    argument,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  DestructuringAssignment: (pattern, expression, token) => ({
    type: "DestructuringAssignment",
    pattern,
    expression,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  BreakStatement: (label, token) => ({
    type: "BreakStatement",
    label,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  ContinueStatement: (label, token) => ({
    type: "ContinueStatement",
    label,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  LoopStatement: (body, label, token) => ({
    type: "LoopStatement",
    body,
    label,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  LabeledStatement: (label, statement, token) => ({
    type: "LabeledStatement",
    label,
    statement,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  MatchStatement: (discriminant, cases, token) => ({
    type: "MatchStatement",
    discriminant,
    cases,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  CaseClause: (pattern, consequent, token) => ({
    type: "CaseClause",
    pattern,
    consequent,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  ArrayPattern: (elements, token) => ({
    type: "ArrayPattern",
    elements,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  ObjectPattern: (properties, token) => ({
    type: "ObjectPattern",
    properties,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  ImportStatement: (path, alias, token) => ({
    type: "ImportStatement",
    path,
    alias,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  ModuleAccess: (module, property, token) => ({
    type: "ModuleAccess",
    module,
    property,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  }),
  TemplateLiteral: (parts, token) => ({
    type: "TemplateLiteral",
    parts,
    line: token.line,
    column: token.column,
    start: token.start,
    length: token.length,
    file: token.file
  })
};

// ../parser/statements/controlFlowParsers.js
function parseIfStatement(parser) {
  const ifToken = parser.expectKeyword("if", "SYN046", 'Expected "if" keyword to start an if statement.');
  const condition = parseExpression(parser);
  const consequent = parseBlock(parser, ["else", "end"]);
  let alternate = null;
  if (parser.matchKeyword("else")) {
    if (parser.peek()?.value === "if" && parser.peek()?.type === TokenType.Keyword) {
      alternate = parseIfStatement(parser);
    } else {
      alternate = parseBlock(parser, ["end"]);
    }
  }
  parser.expectKeyword("end", "SYN047", 'Expected "end" keyword to close if statement.');
  return ASTNode.IfStatement(condition, consequent, alternate, ifToken);
}
function parseWhileStatement(parser) {
  const whileToken = parser.expect(TokenType.Keyword);
  const condition = parseExpression(parser);
  const body = parseBlock(parser);
  parser.expect(TokenType.Keyword, "end");
  return ASTNode.WhileStatement(condition, body, whileToken);
}
function parseForStatement(parser) {
  const forToken = parser.expectKeyword("for", "SYN048", 'Expected "for" keyword to start a for loop.');
  const loopVar = parser.parseIdentifier("SYN048A", "Expected an identifier for the loop variable.");
  parser.expectKeyword("in", "SYN049", 'Expected "in" keyword in for loop (e.g., for item in iterable).');
  const iterable = parseExpression(parser);
  const body = parseBlock(parser, ["end"]);
  parser.expectKeyword("end", "SYN050", 'Expected "end" keyword to close for loop.');
  return ASTNode.ForStatement(loopVar, iterable, body, forToken);
}
function parseLoopStatement(parser) {
  const loopToken = parser.expect(TokenType.Keyword);
  const body = parseBlock(parser);
  parser.expect(TokenType.Keyword, "end");
  return ASTNode.LoopStatement(body, null, loopToken);
}
function parseBreakStatement(parser) {
  const breakToken = parser.expect(TokenType.Keyword);
  let label = null;
  if (parser.peek()?.type === TokenType.Identifier) {
    label = parser.expect(TokenType.Identifier).value;
  }
  return ASTNode.BreakStatement(label, breakToken);
}
function parseContinueStatement(parser) {
  const continueToken = parser.expect(TokenType.Keyword);
  let label = null;
  if (parser.peek()?.type === TokenType.Identifier) {
    label = parser.expect(TokenType.Identifier).value;
  }
  return ASTNode.ContinueStatement(label, continueToken);
}
function parseTryStatement(parser) {
  const tryToken = parser.expectKeyword("try", "SYN051", 'Expected "try" keyword to start a try-catch block.');
  const tryBlock = parseBlock(parser, ["catch", "end"]);
  let catchVar = null;
  let catchBlock = [];
  if (parser.matchKeyword("catch")) {
    if (parser.peek()?.type === TokenType.Identifier) {
      catchVar = parser.parseIdentifier("SYN051A", "Expected an identifier for the catch variable.");
    }
    catchBlock = parseBlock(parser, ["end"]);
  }
  parser.expectKeyword("end", "SYN052", 'Expected "end" keyword to close try-catch block.');
  return ASTNode.TryStatement(tryBlock, catchVar, catchBlock, tryToken);
}

// ../parser/statements/functionParsers.js
function parseFunctionDeclaration(parser, isExported = false, exportToken = null) {
  const funcToken = parser.expectKeyword("function", "SYNXXX", 'Expected "function" keyword.');
  const astNodeLocationToken = exportToken || funcToken;
  const nameToken = parser.expect(TokenType.Identifier, undefined, "SYN054", "Expected a function name (identifier).");
  const name = nameToken.value;
  parser.expect(TokenType.LParen, undefined, "SYN055", "Expected an opening parenthesis for function parameters.");
  const params = [];
  const defaults = {};
  let restParam = null;
  let hasEncounteredDefault = false;
  let hasEncounteredRest = false;
  if (parser.peek()?.type !== TokenType.RParen) {
    do {
      if (hasEncounteredRest) {
        parser.error("No parameters allowed after a rest parameter.", parser.peek(), "SYN060");
      }
      if (parser.match(TokenType.Spread)) {
        const spreadToken = parser.peek(-1);
        const paramNameToken = parser.expect(TokenType.Identifier, undefined, "SYN056", "Expected an identifier for rest parameter.");
        restParam = ASTNode.Identifier(paramNameToken.value, spreadToken);
        hasEncounteredRest = true;
        if (parser.peek()?.type === TokenType.Comma) {
          parser.error("Rest parameter must be the last parameter.", parser.peek(-1), "SYN063");
        }
        break;
      } else {
        const paramNode = parser.parseIdentifier("SYN021", "Expected a parameter name (identifier).");
        params.push(paramNode);
        if (parser.match(TokenType.Colon)) {
          defaults[paramNode.name] = parseExpression(parser);
          hasEncounteredDefault = true;
        } else if (hasEncounteredDefault && !hasEncounteredRest) {
          parser.error("Parameter without default value cannot follow parameter with default value.", paramNode, "SYN_DEFAULT_ORDER");
        }
      }
    } while (parser.match(TokenType.Comma));
  }
  parser.expect(TokenType.RParen, undefined, "SYN026", "Expected a closing parenthesis for function parameters.");
  const body = parseBlock(parser);
  const endToken = parser.expect(TokenType.Keyword, "end", "SYN027", 'Expected "end" keyword to close function declaration.');
  return ASTNode.FunctionDeclaration(name, params, defaults, restParam, body, isExported, astNodeLocationToken, endToken);
}
function parseAnonymousFunction(parser) {
  const funcToken = parser.peek(-1);
  parser.expect(TokenType.LParen, undefined, "SYN020", "Expected an opening parenthesis for function parameters.");
  const params = [];
  const defaults = {};
  let restParam = null;
  let hasEncounteredDefault = false;
  let hasEncounteredRest = false;
  if (parser.peek()?.type !== TokenType.RParen) {
    do {
      if (hasEncounteredRest) {
        parser.error("No parameters allowed after a rest parameter.", parser.peek(), "SYN060");
      }
      if (parser.match(TokenType.Spread)) {
        const spreadToken = parser.peek(-1);
        const paramNameToken = parser.expect(TokenType.Identifier, undefined, "SYN056", "Expected an identifier for rest parameter.");
        restParam = ASTNode.Identifier(paramNameToken.value, spreadToken);
        hasEncounteredRest = true;
        if (parser.peek()?.type === TokenType.Comma) {
          parser.error("Rest parameter must be the last parameter.", parser.peek(-1), "SYN063");
        }
        break;
      } else {
        const paramNode = parser.parseIdentifier("SYN021", "Expected a parameter name (identifier).");
        params.push(paramNode);
        if (parser.match(TokenType.Colon)) {
          defaults[paramNode.name] = parseExpression(parser);
          hasEncounteredDefault = true;
        } else if (hasEncounteredDefault && !hasEncounteredRest) {
          parser.error("Parameter without default value cannot follow parameter with default value.", paramNode, "SYN_DEFAULT_ORDER");
        }
      }
    } while (parser.match(TokenType.Comma));
  }
  parser.expect(TokenType.RParen, undefined, "SYN026", "Expected a closing parenthesis for function parameters.");
  const body = parseBlock(parser);
  const endToken = parser.expect(TokenType.Keyword, "end", "SYN027", 'Expected "end" keyword to close function declaration.');
  return ASTNode.AnonymousFunction(params, defaults, restParam, body, funcToken, endToken);
}
function parseCallExpressionParts(parser, callToken) {
  let callee;
  const firstToken = parser.expect(TokenType.Identifier, undefined, "SYN064", 'Expected a function name (identifier) or module name after "call".');
  if (parser.match(TokenType.Operator, ".")) {
    const propertyToken = parser.expect(TokenType.Identifier, undefined, "SYN065", 'Expected a property name (identifier) after "." for module access.');
    callee = ASTNode.ModuleAccess(firstToken.value, propertyToken.value, firstToken);
  } else {
    callee = ASTNode.Identifier(firstToken.value, firstToken);
  }
  parser.expect(TokenType.LParen, undefined, "SYN066", "Expected an opening parenthesis for function arguments.");
  const args = [];
  if (parser.peek()?.type !== TokenType.RParen) {
    do {
      args.push(parseExpression(parser));
    } while (parser.match(TokenType.Comma));
  }
  parser.expect(TokenType.RParen, undefined, "SYN067", "Expected a closing parenthesis for function arguments.");
  return ASTNode.CallExpression(callee, args, callToken);
}
function parseCallStatement(parser) {
  const callToken = parser.expectKeyword("call", "SYN063", 'Expected "call" keyword to initiate a function call.');
  const callExpression = parseCallExpressionParts(parser, callToken);
  let destination = null;
  if (parser.match(TokenType.Operator, "->")) {
    const destinationToken = parser.expect(TokenType.Identifier, undefined, "SYN069", 'Expected an identifier for the assignment destination after "->".');
    destination = ASTNode.Identifier(destinationToken.value, destinationToken);
  }
  return ASTNode.CallStatement(callExpression.callee, callExpression.arguments, destination, callToken);
}
function parseReturnStatement(parser) {
  const returnToken = parser.expectKeyword("return", "SYN070", 'Expected "return" keyword.');
  let argument = null;
  const nextToken = parser.peek();
  if (parser.isAtEnd() || nextToken.type === TokenType.Keyword && ["end", "else", "catch", "case", "default"].includes(nextToken.value)) {} else {
    argument = parseExpression(parser);
  }
  return ASTNode.ReturnStatement(argument, returnToken);
}
function parseShowStatement(parser) {
  const showToken = parser.expectKeyword("show", "SYN071", 'Expected "show" keyword.');
  const expression = parseExpression(parser);
  return ASTNode.ShowStatement(expression, showToken);
}
function parseThrowStatement(parser) {
  const throwToken = parser.expectKeyword("throw", "SYN072", 'Expected "throw" keyword.');
  const argument = parseExpression(parser);
  return ASTNode.ThrowStatement(argument, throwToken);
}

// ../parser/statements/patternMatchParsers.js
function parseMatchStatement(parser) {
  const matchToken = parser.expectKeyword("match", "SYN081", 'Expected "match" keyword to start a match statement.');
  const discriminant = parseExpression(parser);
  const cases = [];
  while (parser.peek()?.type === TokenType.Keyword && (parser.peek()?.value === "case" || parser.peek()?.value === "default")) {
    if (parser.peek()?.value === "case") {
      const caseToken = parser.expectKeyword("case", "SYN082", 'Expected "case" keyword for a match clause.');
      const pattern = parsePattern(parser);
      parser.expect(TokenType.Colon, undefined, "SYN083", "Expected a colon (:) after the pattern in a match clause.");
      const consequent = parseBlock(parser, ["case", "default", "end"]);
      cases.push(ASTNode.CaseClause(pattern, consequent, caseToken));
    } else if (parser.peek()?.value === "default") {
      const defaultToken = parser.expectKeyword("default", "SYN084", 'Expected "default" keyword for the fallback match clause.');
      parser.expect(TokenType.Colon, undefined, "SYN085", 'Expected a colon (:) after "default" in a match clause.');
      const consequent = parseBlock(parser, ["case", "default", "end"]);
      cases.push(ASTNode.CaseClause(null, consequent, defaultToken));
    }
  }
  if (cases.length === 0) {
    parser.error("Match statement must have at least one 'case' or 'default' clause.", matchToken, "SYN085A", "Add at least one 'case ... : ...' or 'default: ...' block.");
  }
  parser.expectKeyword("end", "SYN086", 'Expected "end" keyword to close match statement.');
  return ASTNode.MatchStatement(discriminant, cases, matchToken);
}
function parsePattern(parser) {
  const token = parser.peek();
  if (token?.type === TokenType.LBracket) {
    const bracketToken = parser.expect(TokenType.LBracket, undefined, "SYN087", "Expected an opening square bracket to start an array pattern.");
    const elements = [];
    if (parser.peek()?.type !== TokenType.RBracket) {
      do {
        elements.push(parsePatternElement(parser));
      } while (parser.match(TokenType.Comma));
    }
    parser.expect(TokenType.RBracket, undefined, "SYN088", "Expected a closing square bracket to end an array pattern.");
    return ASTNode.ArrayPattern(elements, bracketToken);
  }
  return parsePatternElement(parser);
}
function parsePatternElement(parser) {
  const token = parser.peek();
  if (!token) {
    parser.error("Unexpected end of input while parsing pattern element.", parser.peek(-1) || parser.tokens[0], "SYN088A", "A pattern element (literal, identifier, or array) is expected here.");
  }
  switch (token.type) {
    case TokenType.LBracket: {
      const bracketToken = parser.expect(TokenType.LBracket, undefined, "SYN089", "Expected an opening square bracket for nested array pattern.");
      const elements = [];
      if (parser.peek()?.type !== TokenType.RBracket) {
        do {
          elements.push(parsePatternElement(parser));
        } while (parser.match(TokenType.Comma));
      }
      parser.expect(TokenType.RBracket, undefined, "SYN090", "Expected a closing square bracket for nested array pattern.");
      return ASTNode.ArrayPattern(elements, bracketToken);
    }
    case TokenType.Number: {
      const numToken = parser.consume();
      return ASTNode.Literal(Number.parseFloat(numToken.value), numToken);
    }
    case TokenType.String: {
      const strToken = parser.consume();
      return ASTNode.Literal(strToken.value, strToken);
    }
    case TokenType.Boolean: {
      const boolToken = parser.consume();
      return ASTNode.Literal(boolToken.value === "true" || boolToken.value === true, boolToken);
    }
    case TokenType.Null: {
      const nullToken = parser.consume();
      return ASTNode.Literal(null, nullToken);
    }
    case TokenType.Identifier: {
      const idToken = parser.consume();
      return ASTNode.Identifier(idToken.value, idToken);
    }
    default:
      parser.error(`Unexpected token '${token.value}' (${token.type}) in pattern. Expected a literal, identifier, or array pattern.`, token, "SYN091", 'Patterns can be simple values (like 10, "hello", true), identifiers (to bind values), or array patterns (like [a, b]).');
  }
}

// ../parser/statements/variableParsers.js
function parseVariableOrAssignment(parser, isExported = false, exportToken) {
  const kindToken = parser.expectKeyword(["set", "let", "const", "global"], "SYN092");
  const astNodeLocationToken = exportToken || kindToken;
  const identifierToken = parser.expect(TokenType.Identifier, undefined, "SYN097", "Expected an identifier for the variable name.");
  const nextToken = parser.peek();
  let isMemberAssignment = false;
  if (nextToken) {
    if (nextToken.type === TokenType.Operator && nextToken.value === ".") {
      isMemberAssignment = true;
    } else if (nextToken.type === TokenType.LBracket) {
      const hasNoSpace = nextToken.start === identifierToken.start + identifierToken.length;
      if (hasNoSpace) {
        isMemberAssignment = true;
      }
    }
  }
  if (isMemberAssignment) {
    if (kindToken.value !== "set") {
      parser.error(`The '${kindToken.value}' keyword is for declarations. Use 'set' for direct member assignment.`, kindToken, "SYN102");
    }
    let lhs = ASTNode.Identifier(identifierToken.value, identifierToken);
    while (true) {
      const currentToken = parser.peek();
      const hasNoSpace = currentToken && currentToken.start === parser.peek(-1).start + parser.peek(-1).length;
      if (currentToken?.type === TokenType.Operator && currentToken.value === ".") {
        parser.consume();
        const property = parser.expect(TokenType.Identifier, undefined, "SYN098", "Expected property name after dot.");
        lhs = ASTNode.PropertyAccess(lhs, property.value, property);
      } else if (currentToken?.type === TokenType.LBracket && hasNoSpace) {
        parser.consume();
        const index = parseExpression(parser);
        parser.expect(TokenType.RBracket, undefined, "SYN100", "Expected a closing ']' after index.");
        lhs = ASTNode.ArrayAccess(lhs, index, currentToken);
      } else {
        break;
      }
    }
    const value = parseExpression(parser);
    if (lhs.type === "PropertyAccess") {
      return ASTNode.PropertyAssignment(lhs.object, lhs.property, value, astNodeLocationToken);
    } else if (lhs.type === "ArrayAccess") {
      return ASTNode.BracketAssignment(lhs.object, lhs.index, value, astNodeLocationToken);
    } else {
      parser.error("Invalid member assignment target.", lhs, "SYN103");
    }
  } else {
    const value = parseExpression(parser);
    return ASTNode.VariableDeclaration(identifierToken.value, value, kindToken.value, isExported, astNodeLocationToken);
  }
}
function parseObjectPattern(parser) {
  const startBrace = parser.expect(TokenType.LBrace, undefined, "SYN115", 'Expected "{" to start object destructuring pattern.');
  const properties = [];
  if (parser.peek()?.type !== TokenType.RBrace) {
    do {
      properties.push(parser.parseIdentifier("SYN116", "Expected an identifier for property in object destructuring."));
    } while (parser.match(TokenType.Comma));
  }
  parser.expect(TokenType.RBrace, undefined, "SYN117", 'Expected "}" to close object destructuring pattern.');
  return ASTNode.ObjectPattern(properties, startBrace);
}
function parseDestructuringPattern(parser) {
  const token = parser.peek();
  if (token.type === TokenType.LBracket) {
    const startBracket = parser.consume();
    const variables = [];
    if (parser.peek()?.type !== TokenType.RBracket) {
      do {
        variables.push(parser.parseIdentifier("SYN110", "Expected an identifier in destructuring pattern."));
      } while (parser.match(TokenType.Comma));
    }
    parser.expect(TokenType.RBracket, undefined, "SYN111", 'Expected a closing "]" for array destructuring pattern.');
    return ASTNode.ArrayPattern(variables, startBracket);
  } else if (token.type === TokenType.LBrace) {
    return parseObjectPattern(parser);
  }
  parser.error("Expected an array or object pattern (e.g., [a, b] or {a, b}) for destructuring.", token, "SYN112");
}
function parseDestructuringStatement(parser) {
  const destructureToken = parser.expectKeyword("destructure", "SYN113");
  const pattern = parseDestructuringPattern(parser);
  parser.expectKeyword("from", "SYN114", 'Expected "from" keyword after destructuring pattern.');
  const expression = parseExpression(parser);
  return ASTNode.DestructuringAssignment(pattern, expression, destructureToken);
}

// ../parser/statements/moduleParsers.js
function parseImportStatement(parser) {
  const importToken = parser.expectKeyword("import", "SYN073", 'Expected "import" keyword.');
  const pathToken = parser.expect(TokenType.String, undefined, "SYN074", 'Expected a string literal for the module path (e.g., "my_module").');
  parser.expectKeyword("as", "SYN075", 'Expected "as" keyword for module aliasing.');
  const aliasToken = parser.expect(TokenType.Identifier, undefined, "SYN076", "Expected an identifier for the module alias.");
  return ASTNode.ImportStatement(pathToken.value, aliasToken.value, importToken);
}
function parseExportStatement(parser) {
  const exportToken = parser.expectKeyword("export", "SYN077", 'Expected "export" keyword.');
  const nextToken = parser.peek();
  if (!nextToken || parser.isAtEnd()) {
    parser.error("Unexpected end of input after 'export'.", exportToken, "SYN078", "Expected a variable or function declaration to export.");
  }
  if (nextToken.type === TokenType.Keyword) {
    switch (nextToken.value) {
      case "set":
      case "let":
      case "const":
      case "global":
        return parseVariableOrAssignment(parser, true, exportToken);
      case "function":
        return parseFunctionDeclaration(parser, true, exportToken);
      default:
        parser.error(`Cannot export statement of type '${nextToken.value}'. Expected a declaration.`, nextToken, "SYN079", "Only 'set', 'let', 'const', 'global', or 'function' declarations can be exported.");
    }
  }
  parser.error("Expected a declaration keyword (set, let, const, global, function) after 'export'.", nextToken, "SYN080", "Only variable and function declarations can be exported.");
}

// ../parser/parseStatement.js
function parseExpressionStatement(parser) {
  const expression = parseExpression(parser);
  return expression;
}
function parseStatement(parser) {
  const token = parser.peek();
  if (!token || parser.isAtEnd()) {
    parser.error("Unexpected end of input.", null, "SYN000", "Expected a statement or expression, but found end of file.");
  }
  if (token.type === TokenType.Keyword) {
    switch (token.value) {
      case "destructure":
        return parseDestructuringStatement(parser);
      case "set":
      case "let":
      case "const":
      case "global":
        return parseVariableOrAssignment(parser, false, token);
      case "if":
        return parseIfStatement(parser);
      case "for":
        return parseForStatement(parser);
      case "while":
        return parseWhileStatement(parser);
      case "loop":
        return parseLoopStatement(parser);
      case "break":
        return parseBreakStatement(parser);
      case "continue":
        return parseContinueStatement(parser);
      case "try":
        return parseTryStatement(parser);
      case "function":
        return parseFunctionDeclaration(parser, false);
      case "call":
        return parseCallStatement(parser);
      case "return":
        return parseReturnStatement(parser);
      case "show":
        return parseShowStatement(parser);
      case "throw":
        return parseThrowStatement(parser);
      case "match":
        return parseMatchStatement(parser);
      case "import":
        return parseImportStatement(parser);
      case "export":
        return parseExportStatement(parser);
      default:
        parser.error(`Unexpected keyword '${token.value}' at the start of a statement.`, token, "SYN005", "Expected a statement keyword (like 'set', 'if', 'function', 'call', 'show', etc.).");
    }
  }
  return parseExpressionStatement(parser);
}

// ../parser/parserUtils.js
function parseBlock(parser, customEndKeywords = []) {
  const endKeywords = new Set([...END_KEYWORDS, ...customEndKeywords]);
  const statements = [];
  while (!parser.isAtEnd() && !isBlockEnd(parser, endKeywords)) {
    statements.push(parseStatement(parser));
  }
  return statements;
}
function isBlockEnd(parser, endKeywords) {
  const token = parser.peek();
  return token.type === TokenType.Keyword && endKeywords.has(token.value);
}

// ../parser/expressions/atomicExpressions.js
var parseExpression2;
function setParseExpression(parseExpressionFn) {
  parseExpression2 = parseExpressionFn;
}
function parseAtomicExpression(parser) {
  const token = parser.peek();
  switch (token?.type) {
    case TokenType.Identifier: {
      const consumedToken = parser.consume();
      return ASTNode.Identifier(consumedToken.value, consumedToken);
    }
    case TokenType.Number: {
      const consumedToken = parser.consume();
      return ASTNode.Literal(Number.parseFloat(consumedToken.value), consumedToken);
    }
    case TokenType.String: {
      const consumedToken = parser.consume();
      return ASTNode.Literal(consumedToken.value, consumedToken);
    }
    case TokenType.Boolean: {
      const consumedToken = parser.consume();
      return ASTNode.Literal(consumedToken.value, consumedToken);
    }
    case TokenType.Null: {
      const consumedToken = parser.consume();
      return ASTNode.Literal(null, consumedToken);
    }
    case TokenType.Backtick:
      return parseTemplateLiteral(parser);
    case TokenType.LBracket:
      return parseArrayLiteral(parser);
    case TokenType.LBrace:
      return parseObjectLiteral(parser);
    case TokenType.LParen: {
      parser.consume();
      const expr = parseExpression2(parser);
      parser.expect(TokenType.RParen, undefined, "SYN018", "Expected a closing parenthesis for grouped expression.");
      return expr;
    }
    case TokenType.Keyword:
      if (token.value === "function") {
        parser.consume();
        return parseAnonymousFunction(parser);
      }
      if (token.value === "call") {
        parser.consume();
        return parseCallExpressionParts(parser, token);
      }
      parser.error(`Unexpected keyword "${token.value}" in expression context.`, token, "SYN010");
      break;
    default:
      parser.error(`Unexpected token in expression "${token?.value}".`, token, "SYN010", "Expected a literal, identifier, array, object, or function.");
  }
}
function parseArrayLiteral(parser) {
  const startBracket = parser.expect(TokenType.LBracket, undefined, "SYN011", "Expected an opening square bracket to start an array literal.");
  const elements = [];
  if (parser.peek()?.type !== TokenType.RBracket) {
    if (parser.peek()?.type === TokenType.Spread) {
      const spreadToken = parser.consume();
      const argument = parseExpression2(parser);
      elements.push(ASTNode.SpreadElement(argument, spreadToken));
    } else {
      elements.push(parseExpression2(parser));
    }
    while (parser.peek()?.type === TokenType.Comma) {
      parser.consume();
      if (parser.peek()?.type === TokenType.RBracket)
        break;
      if (parser.peek()?.type === TokenType.Spread) {
        const spreadToken = parser.consume();
        const argument = parseExpression2(parser);
        elements.push(ASTNode.SpreadElement(argument, spreadToken));
      } else {
        elements.push(parseExpression2(parser));
      }
    }
  }
  parser.expect(TokenType.RBracket, undefined, "SYN012", "Expected a closing square bracket to end an array literal.");
  return ASTNode.ArrayLiteral(elements, startBracket);
}
function parseObjectLiteral(parser) {
  const startBrace = parser.expect(TokenType.LBrace, undefined, "SYN013", "Expected an opening curly brace to start an object literal.");
  const properties = [];
  if (parser.peek()?.type !== TokenType.RBrace) {
    let keyToken = parser.expect(TokenType.Identifier, undefined, "SYN014", "Expected a property name (identifier) in object literal.");
    parser.expect(TokenType.Colon, undefined, "SYN015", 'Expected a colon ":" after property name in object literal.');
    const value = parseExpression2(parser);
    properties.push({ key: keyToken.value, value });
    while (parser.peek()?.type === TokenType.Comma) {
      parser.consume();
      if (parser.peek()?.type === TokenType.RBrace)
        break;
      keyToken = parser.expect(TokenType.Identifier, undefined, "SYN016", "Expected another property name (identifier) after comma in object literal.");
      parser.expect(TokenType.Colon, undefined, "SYN017", 'Expected a colon ":" after property name in object literal.');
      const value2 = parseExpression2(parser);
      properties.push({ key: keyToken.value, value: value2 });
    }
  }
  parser.expect(TokenType.RBrace, undefined, "SYN018", "Expected a closing curly brace to end an object literal.");
  return ASTNode.ObjectLiteral(properties, startBrace);
}
function parseTemplateLiteral(parser) {
  const startToken = parser.expect(TokenType.Backtick, "`", "SYN104", "Expected backtick ` to start a template literal.");
  const parts = [];
  while (!parser.isAtEnd() && parser.peek()?.type !== TokenType.Backtick) {
    const token = parser.peek();
    if (token.type === TokenType.StringFragment) {
      parser.consume();
      if (token.value.length > 0) {
        parts.push(ASTNode.Literal(token.value, token));
      }
    } else if (token.type === TokenType.InterpolationStart) {
      parser.consume();
      const expr = parseExpression2(parser);
      parts.push(expr);
      parser.expect(TokenType.InterpolationEnd, "}", "SYN105", "Expected closing brace } after expression in template literal.");
    } else {
      parser.error(`Unexpected token '${token.value}' inside a template literal.`, token, "SYN106");
    }
  }
  parser.expect(TokenType.Backtick, "`", "SYN107", "Expected backtick ` to end a template literal.");
  return ASTNode.TemplateLiteral(parts, startToken);
}

// ../parser/expressions/primaryExpressions.js
var parseExpression3;
function setParseExpression2(parseExpressionFn) {
  parseExpression3 = parseExpressionFn;
}
function parsePrimaryExpression(parser) {
  let primaryExpr = parseAtomicExpression(parser);
  while (true) {
    const nextToken = parser.peek();
    if (!nextToken)
      break;
    if (nextToken.type === TokenType.Operator && (nextToken.value === "." || nextToken.value === "?.")) {
      const operatorToken = parser.consume();
      const property = parser.expect(TokenType.Identifier, undefined, "SYN042", "Expected property name after dot operator.");
      if (operatorToken.value === "?.") {
        primaryExpr = ASTNode.SafePropertyAccess(primaryExpr, property.value, property);
      } else {
        primaryExpr = ASTNode.PropertyAccess(primaryExpr, property.value, property);
      }
    } else if (nextToken.type === TokenType.LBracket) {
      const startBracketToken = parser.consume();
      const indexExpr = parseExpression3(parser);
      parser.expect(TokenType.RBracket, undefined, "SYN041", "Expected closing square bracket for array/object access (e.g., arr[index]).");
      primaryExpr = ASTNode.ArrayAccess(primaryExpr, indexExpr, startBracketToken);
    } else {
      break;
    }
  }
  return primaryExpr;
}

// ../parser/expressions/operatorExpressions.js
var parseExpression4;
var parsePrimaryExpression2;
var STATEMENT_START_KEYWORDS = new Set([
  "set",
  "let",
  "const",
  "global",
  "if",
  "while",
  "for",
  "loop",
  "function",
  "call",
  "show",
  "return",
  "try",
  "throw",
  "match",
  "import",
  "export",
  "break",
  "continue"
]);
function setParseExpression3(parseExpressionFn) {
  parseExpression4 = parseExpressionFn;
}
function setParsePrimaryExpression(parsePrimaryExpressionFn) {
  parsePrimaryExpression2 = parsePrimaryExpressionFn;
}
function parseBinaryOrUnary(parser) {
  const token = parser.peek();
  if (token?.type !== TokenType.Operator) {
    return parsePrimaryExpression2(parser);
  }
  const operatorToken = parser.consume();
  const operator = operatorToken.value;
  if (operator === "not") {
    const argument = parseExpression4(parser);
    return ASTNode.UnaryExpression(operator, argument, operatorToken);
  }
  const left = parseExpression4(parser);
  const nextToken = parser.peek();
  const isEndOfExpression = parser.isAtEnd() || !nextToken || nextToken.type === TokenType.RParen || nextToken.type === TokenType.RBracket || nextToken.type === TokenType.RBrace || nextToken.type === TokenType.Comma || nextToken.type === TokenType.Colon || nextToken.type === TokenType.Keyword && (END_KEYWORDS.includes(nextToken.value) || STATEMENT_START_KEYWORDS.has(nextToken.value));
  if (isEndOfExpression) {
    if (operator !== "-") {
      parser.error(`Operator '${operator}' cannot be used as a unary operator.`, operatorToken, "SYN039", `Did you mean to provide a second argument?`);
    }
    return ASTNode.UnaryExpression(operator, left, operatorToken);
  } else {
    const right = parseExpression4(parser);
    return ASTNode.BinaryExpression(operator, left, right, operatorToken);
  }
}

// ../parser/parserExpressions.js
function parseExpression(parser) {
  return parseBinaryOrUnary(parser);
}
function setupExpressionParsers() {
  setParseExpression(parseExpression);
  setParseExpression2(parseExpression);
  setParseExpression3(parseExpression);
  setParsePrimaryExpression(parsePrimaryExpression);
}

// ../parser/Parser.js
class Parser {
  constructor(tokens, filePath = "unknown") {
    this.tokens = tokens;
    this.current = 0;
    this.filePath = filePath;
    this.errorHandler = null;
  }
  setErrorHandler(errorHandler) {
    this.errorHandler = errorHandler;
  }
  error(message, token = this.peek(), code = "SYN000", suggestion = "") {
    let errorToken = token;
    if (!errorToken || errorToken.type === undefined || errorToken.line === undefined) {
      errorToken = this.tokens[this.current - 1] || {
        type: "EOF",
        value: "",
        line: 1,
        column: 1,
        start: 0,
        length: 0,
        file: this.filePath
      };
    }
    errorToken.file = errorToken.file || this.filePath;
    if (this.errorHandler) {
      throw this.errorHandler.createSyntaxError(message, errorToken, code, suggestion);
    } else {
      throw new MimoError("SyntaxError", code, message, suggestion, {
        line: errorToken.line,
        column: errorToken.column,
        file: errorToken.file
      });
    }
  }
  expect(type, value, code = "SYN000", suggestion = "Syntax error.") {
    const token = this.peek();
    if (token.type === type && (value === undefined || token.value === value)) {
      return this.consume();
    }
    const displayValue = value ? `'${value}' (${type})` : type;
    const displayGot = token.value ? `'${token.value}' (${token.type})` : token.type;
    this.error(`Expected ${displayValue} but got ${displayGot}.`, token, code, suggestion);
  }
  expectKeyword(keyword, code = "SYN000", suggestion = "Syntax error.") {
    const token = this.peek();
    if (token.type === TokenType.Keyword) {
      if (Array.isArray(keyword)) {
        if (keyword.includes(token.value)) {
          return this.consume();
        }
        const expectedKeywords = keyword.map((k) => `'${k}'`).join(", ");
        this.error(`Expected one of ${expectedKeywords} but got '${token.value}' (${token.type}).`, token, code, suggestion);
      } else {
        if (token.value === keyword) {
          return this.consume();
        }
        this.error(`Expected '${keyword}' (keyword) but got '${token.value}' (${token.type}).`, token, code, suggestion);
      }
    }
    this.error(`Expected keyword but got '${token.value}' (${token.type}).`, token, code, suggestion);
  }
  match(type, value) {
    const token = this.peek();
    if (token && token.type === type && (!value || token.value === value)) {
      this.consume();
      return true;
    }
    return false;
  }
  matchKeyword(keyword) {
    return this.match(TokenType.Keyword, keyword);
  }
  isAtEnd() {
    return this.current >= this.tokens.length;
  }
  peek(index = 0) {
    return this.tokens[this.current + index];
  }
  consume() {
    const token = this.tokens[this.current];
    this.current++;
    return token;
  }
  parseIdentifier(code = "SYN000", suggestion = "Expected an identifier.") {
    const token = this.peek();
    if (token.type === TokenType.Identifier) {
      this.consume();
      return ASTNode.Identifier(token.value, token);
    }
    this.error(`Expected an identifier but got ${token.type} '${token.value}'.`, token, code, suggestion);
  }
  parse() {
    setupExpressionParsers();
    const statements = [];
    const programStartToken = this.tokens[0] || {
      type: "ProgramStart",
      value: "",
      line: 1,
      column: 1,
      start: 0,
      length: 0,
      file: this.filePath
    };
    while (!this.isAtEnd()) {
      if (this.isAtEnd())
        break;
      statements.push(parseStatement(this));
    }
    return ASTNode.Program(statements, programStartToken);
  }
}

// ../interpreter/stdlib/assert.js
function isDeepEqual(a, b) {
  if (a === b)
    return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b))
    return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length)
    return false;
  for (const key of keysA) {
    if (!keysB.includes(key) || !isDeepEqual(a[key], b[key])) {
      return false;
    }
  }
  return true;
}
var assertEq = new BuiltinFunction("eq", (args, interpreter, callNode) => {
  const [actual, expected, message] = args;
  if (!isDeepEqual(actual, expected)) {
    const msg = message ? `: ${message}` : "";
    throw interpreter.errorHandler.createRuntimeError(`Assertion Failed${msg}.
   Expected: ${stringify(expected)}
   Actual:   ${stringify(actual)}`, callNode, "ASSERT_FAIL");
  }
  return true;
}, [2, 3]);
var assertNeq = new BuiltinFunction("neq", (args, interpreter, callNode) => {
  const [actual, expected, message] = args;
  if (isDeepEqual(actual, expected)) {
    const msg = message ? `: ${message}` : "";
    throw interpreter.errorHandler.createRuntimeError(`Assertion Failed${msg}. Expected values to be different.`, callNode, "ASSERT_FAIL");
  }
  return true;
}, [2, 3]);
var assertTrue = new BuiltinFunction("true", (args, interpreter, callNode) => {
  const [condition, message] = args;
  if (condition !== true) {
    const msg = message ? `: ${message}` : "";
    throw interpreter.errorHandler.createRuntimeError(`Assertion Failed${msg}. Expected true, got ${stringify(condition)}`, callNode, "ASSERT_FAIL");
  }
  return true;
}, [1, 2]);
var assertFalse = new BuiltinFunction("false", (args, interpreter, callNode) => {
  const [condition, message] = args;
  if (condition !== false) {
    const msg = message ? `: ${message}` : "";
    throw interpreter.errorHandler.createRuntimeError(`Assertion Failed${msg}. Expected false, got ${stringify(condition)}`, callNode, "ASSERT_FAIL");
  }
  return true;
}, [1, 2]);
var assertThrows = new BuiltinFunction("throws", (args, interpreter, callNode) => {
  const [fn, message] = args;
  if (!fn || typeof fn.call !== "function") {
    throw interpreter.errorHandler.createRuntimeError(`assert.throws expects a function as the first argument.`, callNode, "TYPE001");
  }
  try {
    fn.call(interpreter, [], callNode);
  } catch (error) {
    return true;
  }
  const msg = message ? `: ${message}` : "";
  throw interpreter.errorHandler.createRuntimeError(`Assertion Failed${msg}. Expected function to throw an error, but it did not.`, callNode, "ASSERT_FAIL");
}, [1, 2]);
var assertModule = {
  eq: assertEq,
  neq: assertNeq,
  true: assertTrue,
  false: assertFalse,
  throws: assertThrows
};

// ../interpreter/stdlib/datetime.js
function expectDate(arg, funcName, interpreter, callNode) {
  if (!(arg instanceof Date)) {
    throw interpreter.errorHandler.createRuntimeError(`${funcName}() expects a datetime object as its first argument.`, callNode, "TYPE001", "Use a value returned from datetime.now() or datetime.from_timestamp().");
  }
}
var dtNow = new BuiltinFunction("now", () => {
  return new Date;
}, 0);
var dtGetTimestamp = new BuiltinFunction("get_timestamp", (args, interpreter, callNode) => {
  const [dateObj] = args;
  expectDate(dateObj, "datetime.get_timestamp", interpreter, callNode);
  return dateObj.getTime();
}, 1);
var dtFromTimestamp = new BuiltinFunction("from_timestamp", ([timestamp], interpreter, callNode) => {
  if (typeof timestamp !== "number") {
    throw interpreter.errorHandler.createRuntimeError(`datetime.from_timestamp() expects a number (milliseconds). Got '${typeof timestamp}'.`, callNode, "TYPE001", "Provide a numeric timestamp.");
  }
  return new Date(timestamp);
}, 1);
var dtToISOString = new BuiltinFunction("to_iso_string", ([dateObj], interpreter, callNode) => {
  expectDate(dateObj, "datetime.to_iso_string", interpreter, callNode);
  return dateObj.toISOString();
}, 1);
var dtFormat = new BuiltinFunction("format", (args, interpreter, callNode) => {
  const [dateObj, formatStr] = args;
  expectDate(dateObj, "datetime.format", interpreter, callNode);
  if (typeof formatStr !== "string") {
    throw interpreter.errorHandler.createRuntimeError(`datetime.format() expects a format string as its second argument. Got '${typeof formatStr}'.`, callNode, "TYPE001", 'Provide a format string (e.g., "YYYY-MM-DD").');
  }
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const seconds = String(dateObj.getSeconds()).padStart(2, "0");
  let formatted = formatStr;
  formatted = formatted.replace(/YYYY/g, year);
  formatted = formatted.replace(/MM/g, month);
  formatted = formatted.replace(/DD/g, day);
  formatted = formatted.replace(/hh/g, hours);
  formatted = formatted.replace(/mm/g, minutes);
  formatted = formatted.replace(/ss/g, seconds);
  return formatted;
}, 2);
var dtAdd = new BuiltinFunction("add", (args, interpreter, callNode) => {
  const [dateObj, amount, unit] = args;
  expectDate(dateObj, "datetime.add", interpreter, callNode);
  if (typeof amount !== "number") {
    throw interpreter.errorHandler.createRuntimeError(`datetime.add() expects a numeric amount. Got '${typeof amount}'.`, callNode, "TYPE001", "Provide a numeric amount to add.");
  }
  if (typeof unit !== "string") {
    throw interpreter.errorHandler.createRuntimeError(`datetime.add() expects a string unit. Got '${typeof unit}'.`, callNode, "TYPE001", 'Provide a string unit (e.g., "days").');
  }
  const newDate = new Date(dateObj.getTime());
  switch (unit.toLowerCase()) {
    case "years":
      newDate.setFullYear(newDate.getFullYear() + amount);
      break;
    case "months":
      newDate.setMonth(newDate.getMonth() + amount);
      break;
    case "days":
      newDate.setDate(newDate.getDate() + amount);
      break;
    case "hours":
      newDate.setHours(newDate.getHours() + amount);
      break;
    case "minutes":
      newDate.setMinutes(newDate.getMinutes() + amount);
      break;
    case "seconds":
      newDate.setSeconds(newDate.getSeconds() + amount);
      break;
    default:
      throw interpreter.errorHandler.createRuntimeError(`Unknown unit '${unit}' for datetime.add().`, callNode, "ARG001", "Supported units: years, months, days, hours, minutes, seconds.");
  }
  return newDate;
}, 3);
var dtSubtract = new BuiltinFunction("subtract", (args, interpreter, callNode) => {
  const [dateObj, amount, unit] = args;
  expectDate(dateObj, "datetime.subtract", interpreter, callNode);
  if (typeof amount !== "number") {
    throw interpreter.errorHandler.createRuntimeError(`datetime.subtract() expects a numeric amount. Got '${typeof amount}'.`, callNode, "TYPE001", "Provide a numeric amount to subtract.");
  }
  if (typeof unit !== "string") {
    throw interpreter.errorHandler.createRuntimeError(`datetime.subtract() expects a string unit. Got '${typeof unit}'.`, callNode, "TYPE001", 'Provide a string unit (e.g., "days").');
  }
  const newDate = new Date(dateObj.getTime());
  switch (unit.toLowerCase()) {
    case "years":
      newDate.setFullYear(newDate.getFullYear() - amount);
      break;
    case "months":
      newDate.setMonth(newDate.getMonth() - amount);
      break;
    case "days":
      newDate.setDate(newDate.getDate() - amount);
      break;
    case "hours":
      newDate.setHours(newDate.getHours() - amount);
      break;
    case "minutes":
      newDate.setMinutes(newDate.getMinutes() - amount);
      break;
    case "seconds":
      newDate.setSeconds(newDate.getSeconds() - amount);
      break;
    default:
      throw interpreter.errorHandler.createRuntimeError(`Unknown unit '${unit}' for datetime.subtract().`, callNode, "ARG001", "Supported units: years, months, days, hours, minutes, seconds.");
  }
  return newDate;
}, 3);
var datetimeModule = {
  now: dtNow,
  get_timestamp: dtGetTimestamp,
  from_timestamp: dtFromTimestamp,
  to_iso_string: dtToISOString,
  format: dtFormat,
  add: dtAdd,
  subtract: dtSubtract
};

// ../interpreter/stdlib/fs.js
function expectString(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (typeof arg !== "string") {
    throw interpreter.errorHandler.createRuntimeError(`${funcName}() expects a string path as argument ${argPosition}. Got '${typeof arg}'.`, callNode, "TYPE001", 'Provide a string path (e.g., "./my_file.txt").');
  }
}
var fsReadFile = new BuiltinFunction("read_file", ([filePath], interpreter, callNode) => {
  expectString(filePath, "fs.read_file", interpreter, callNode);
  try {
    return interpreter.adapter.readFileSync(filePath, "utf-8");
  } catch (e) {
    throw interpreter.errorHandler.createRuntimeError(`Failed to read file '${filePath}': ${e.message}`, callNode, "FS001", "Ensure the file exists and you have read permissions.");
  }
}, 1);
var fsWriteFile = new BuiltinFunction("write_file", ([filePath, content], interpreter, callNode) => {
  expectString(filePath, "fs.write_file", interpreter, callNode, 1);
  if (typeof content !== "string") {
    throw interpreter.errorHandler.createRuntimeError("fs.write_file() expects string content as its second argument.", callNode, "TYPE001", "Provide the string content to write to the file.");
  }
  try {
    interpreter.adapter.writeFileSync(filePath, content, "utf-8");
    return null;
  } catch (e) {
    throw interpreter.errorHandler.createRuntimeError(`Failed to write to file '${filePath}': ${e.message}`, callNode, "FS002", "Ensure you have write permissions for the directory.");
  }
}, 2);
var fsFileExists = new BuiltinFunction("exists", ([filePath], interpreter, callNode) => {
  expectString(filePath, "fs.exists", interpreter, callNode);
  return interpreter.adapter.existsSync(filePath);
}, 1);
var fsListDir = new BuiltinFunction("list_dir", ([dirPath], interpreter, callNode) => {
  expectString(dirPath, "fs.list_dir", interpreter, callNode);
  try {
    return interpreter.adapter.readdirSync(dirPath);
  } catch (e) {
    throw interpreter.errorHandler.createRuntimeError(`Failed to list directory '${dirPath}': ${e.message}`, callNode, "FS003", "Ensure the path is a directory and you have read permissions.");
  }
}, 1);
var fsMakeDir = new BuiltinFunction("make_dir", ([dirPath, recursive], interpreter, callNode) => {
  expectString(dirPath, "fs.make_dir", interpreter, callNode);
  const recursiveOption = recursive === true;
  try {
    interpreter.adapter.mkdirSync(dirPath, { recursive: recursiveOption });
    return true;
  } catch (e) {
    throw interpreter.errorHandler.createRuntimeError(`Failed to create directory '${dirPath}': ${e.message}`, callNode, "FS004", "Ensure the parent directory exists and you have write permissions.");
  }
}, [1, 2]);
var fsRemoveFile = new BuiltinFunction("remove_file", ([filePath], interpreter, callNode) => {
  expectString(filePath, "fs.remove_file", interpreter, callNode);
  try {
    interpreter.adapter.unlinkSync(filePath);
    return true;
  } catch (e) {
    throw interpreter.errorHandler.createRuntimeError(`Failed to remove file '${filePath}': ${e.message}`, callNode, "FS005", "Ensure the file exists and you have write permissions.");
  }
}, 1);
var fsRemoveDir = new BuiltinFunction("remove_dir", ([dirPath, recursive], interpreter, callNode) => {
  expectString(dirPath, "fs.remove_dir", interpreter, callNode);
  const isRecursive = recursive === true;
  try {
    if (isRecursive) {
      interpreter.adapter.rmSync(dirPath, { recursive: true, force: true });
    } else {
      interpreter.adapter.rmdirSync(dirPath);
    }
    return true;
  } catch (e) {
    throw interpreter.errorHandler.createRuntimeError(`Failed to remove directory '${dirPath}': ${e.message}`, callNode, "FS006", "Ensure the directory exists and you have write permissions. Use the recursive option for non-empty directories.");
  }
}, [1, 2]);
var fsModule = {
  read_file: fsReadFile,
  write_file: fsWriteFile,
  exists: fsFileExists,
  list_dir: fsListDir,
  make_dir: fsMakeDir,
  remove_file: fsRemoveFile,
  remove_dir: fsRemoveDir
};

// ../interpreter/stdlib/http.js
function expectString2(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (typeof arg !== "string") {
    throw interpreter.errorHandler.createRuntimeError(`${funcName}() expects a string as argument ${argPosition}. Got '${typeof arg}'.`, callNode, "TYPE001", "Provide a URL string.");
  }
}
function expectObject(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (typeof arg !== "object" || arg === null || Array.isArray(arg)) {
    throw interpreter.errorHandler.createRuntimeError(`${funcName}() expects an object as argument ${argPosition}.`, callNode, "TYPE001");
  }
}
var httpGet = new BuiltinFunction("get", (args, interpreter, callNode) => {
  const [url] = args;
  expectString2(url, "http.get", interpreter, callNode, 1);
  try {
    return interpreter.adapter.fetchSync(url, { method: "GET" });
  } catch (e) {
    throw interpreter.errorHandler.createRuntimeError(`HTTP GET request failed: ${e.message}`, callNode, "HTTP001");
  }
}, 1);
var httpPost = new BuiltinFunction("post", (args, interpreter, callNode) => {
  const [url, body, headers] = args;
  expectString2(url, "http.post", interpreter, callNode, 1);
  if (typeof body !== "string") {
    throw interpreter.errorHandler.createRuntimeError(`http.post() body must be a string. Use json.stringify(data) first.`, callNode, "TYPE001");
  }
  let requestHeaders = { "Content-Type": "application/json" };
  if (headers !== undefined) {
    expectObject(headers, "http.post", interpreter, callNode, 3);
    requestHeaders = { ...requestHeaders, ...headers };
  }
  try {
    return interpreter.adapter.fetchSync(url, {
      method: "POST",
      body,
      headers: requestHeaders
    });
  } catch (e) {
    throw interpreter.errorHandler.createRuntimeError(`HTTP POST request failed: ${e.message}`, callNode, "HTTP002");
  }
}, [2, 3]);
var httpModule = {
  get: httpGet,
  post: httpPost
};

// ../interpreter/stdlib/json.js
function expectString3(arg, funcName, interpreter, callNode) {
  if (typeof arg !== "string") {
    throw interpreter.errorHandler.createRuntimeError(`${funcName}() expects a JSON string as its argument.`, callNode, "TYPE001", "Provide a string containing valid JSON.");
  }
}
var jsonParse = new BuiltinFunction("parse", ([jsonString], interpreter, callNode) => {
  expectString3(jsonString, "json.parse", interpreter, callNode);
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    throw interpreter.errorHandler.createRuntimeError(`Failed to parse JSON string: ${e.message}`, callNode, "JSON001", "Ensure the string contains valid JSON syntax.");
  }
}, 1);
var jsonStringify = new BuiltinFunction("stringify", (args, interpreter, callNode) => {
  const [value, indent] = args;
  let indentArg = null;
  if (args.length > 1) {
    if (typeof indent !== "number" && typeof indent !== "string") {
      throw interpreter.errorHandler.createRuntimeError("json.stringify() second argument (indent) must be a number or a string.", callNode, "TYPE001", "Provide a number for spaces or a string for the indent characters.");
    }
    if (typeof indent === "number" && indent < 0) {
      throw interpreter.errorHandler.createRuntimeError("json.stringify() indent number must be non-negative.", callNode, "ARG001", "Provide a non-negative number for indentation.");
    }
    indentArg = indent;
  }
  try {
    return JSON.stringify(value, null, indentArg);
  } catch (e) {
    throw interpreter.errorHandler.createRuntimeError(`Failed to stringify value to JSON: ${e.message}`, callNode, "JSON001", "Ensure the value can be serialized to JSON (e.g., no functions or circular references).");
  }
}, [1, 2]);
var jsonModule = {
  parse: jsonParse,
  stringify: jsonStringify
};

// ../interpreter/stdlib/math.js
var MIMO_PI = Math.PI;
var MIMO_E = Math.E;
var _currentSeed = null;
function seededRandom() {
  if (_currentSeed === null)
    return Math.random();
  _currentSeed = _currentSeed * 16807 % 2147483647;
  return (_currentSeed - 1) / 2147483646;
}
function expectNumber2(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (typeof arg !== "number") {
    throw interpreter.errorHandler.createRuntimeError(`${funcName}() expects a number as argument ${argPosition}. Got '${typeof arg}'.`, callNode, "TYPE001", `Ensure argument ${argPosition} for '${funcName}' is a number.`);
  }
}
function expectNumbers(args, funcName, expectedCount, interpreter, callNode) {
  if (args.length < expectedCount) {
    throw interpreter.errorHandler.createRuntimeError(`${funcName}() expects at least ${expectedCount} arguments, got ${args.length}.`, callNode, "BUILTIN001", `Provide at least ${expectedCount} arguments for '${funcName}'.`);
  }
  for (let i = 0;i < expectedCount; i++) {
    if (typeof args[i] !== "number") {
      throw interpreter.errorHandler.createRuntimeError(`${funcName}() expects a number as argument ${i + 1}. Got '${typeof args[i]}'.`, callNode, "TYPE001", `Ensure argument ${i + 1} for '${funcName}' is a number.`);
    }
  }
}
var mathSin = new BuiltinFunction("sin", (args, interpreter, callNode) => {
  expectNumber2(args[0], "sin", interpreter, callNode, 1);
  return Math.sin(args[0]);
}, 1);
var mathCos = new BuiltinFunction("cos", (args, interpreter, callNode) => {
  expectNumber2(args[0], "cos", interpreter, callNode, 1);
  return Math.cos(args[0]);
}, 1);
var mathTan = new BuiltinFunction("tan", (args, interpreter, callNode) => {
  expectNumber2(args[0], "tan", interpreter, callNode, 1);
  return Math.tan(args[0]);
}, 1);
var mathAsin = new BuiltinFunction("asin", (args, interpreter, callNode) => {
  expectNumber2(args[0], "asin", interpreter, callNode, 1);
  return Math.asin(args[0]);
}, 1);
var mathAcos = new BuiltinFunction("acos", (args, interpreter, callNode) => {
  expectNumber2(args[0], "acos", interpreter, callNode, 1);
  return Math.acos(args[0]);
}, 1);
var mathAtan = new BuiltinFunction("atan", (args, interpreter, callNode) => {
  expectNumber2(args[0], "atan", interpreter, callNode, 1);
  return Math.atan(args[0]);
}, 1);
var mathAtan2 = new BuiltinFunction("atan2", (args, interpreter, callNode) => {
  expectNumbers(args, "atan2", 2, interpreter, callNode);
  return Math.atan2(args[0], args[1]);
}, 2);
var mathLog = new BuiltinFunction("log", (args, interpreter, callNode) => {
  expectNumber2(args[0], "log", interpreter, callNode, 1);
  return Math.log(args[0]);
}, 1);
var mathLog10 = new BuiltinFunction("log10", (args, interpreter, callNode) => {
  expectNumber2(args[0], "log10", interpreter, callNode, 1);
  return Math.log10(args[0]);
}, 1);
var mathLog2 = new BuiltinFunction("log2", (args, interpreter, callNode) => {
  expectNumber2(args[0], "log2", interpreter, callNode, 1);
  return Math.log2(args[0]);
}, 1);
var mathExp = new BuiltinFunction("exp", (args, interpreter, callNode) => {
  expectNumber2(args[0], "exp", interpreter, callNode, 1);
  return Math.exp(args[0]);
}, 1);
var mathPow = new BuiltinFunction("pow", (args, interpreter, callNode) => {
  expectNumbers(args, "pow", 2, interpreter, callNode);
  return Math.pow(args[0], args[1]);
}, 2);
var mathSqrt = new BuiltinFunction("sqrt", (args, interpreter, callNode) => {
  expectNumber2(args[0], "sqrt", interpreter, callNode, 1);
  return Math.sqrt(args[0]);
}, 1);
var mathCbrt = new BuiltinFunction("cbrt", (args, interpreter, callNode) => {
  expectNumber2(args[0], "cbrt", interpreter, callNode, 1);
  return Math.cbrt(args[0]);
}, 1);
var mathFloor = new BuiltinFunction("floor", (args, interpreter, callNode) => {
  expectNumber2(args[0], "floor", interpreter, callNode, 1);
  return Math.floor(args[0]);
}, 1);
var mathCeil = new BuiltinFunction("ceil", (args, interpreter, callNode) => {
  expectNumber2(args[0], "ceil", interpreter, callNode, 1);
  return Math.ceil(args[0]);
}, 1);
var mathRound = new BuiltinFunction("round", (args, interpreter, callNode) => {
  expectNumber2(args[0], "round", interpreter, callNode, 1);
  return Math.round(args[0]);
}, 1);
var mathAbs = new BuiltinFunction("abs", (args, interpreter, callNode) => {
  expectNumber2(args[0], "abs", interpreter, callNode, 1);
  return Math.abs(args[0]);
}, 1);
var mathMax = new BuiltinFunction("max", (args, interpreter, callNode) => {
  if (args.length === 0) {
    throw interpreter.errorHandler.createRuntimeError("max() expects at least one number.", callNode, "BUILTIN001", "Provide at least one number to max().");
  }
  args.forEach((arg, i) => expectNumber2(arg, "max", interpreter, callNode, i + 1));
  return Math.max(...args);
}, [1, Infinity]);
var mathMin = new BuiltinFunction("min", (args, interpreter, callNode) => {
  if (args.length === 0) {
    throw interpreter.errorHandler.createRuntimeError("min() expects at least one number.", callNode, "BUILTIN001", "Provide at least one number to min().");
  }
  args.forEach((arg, i) => expectNumber2(arg, "min", interpreter, callNode, i + 1));
  return Math.min(...args);
}, [1, Infinity]);
var mathRandom = new BuiltinFunction("random", (args, interpreter, callNode) => {
  return seededRandom();
}, 0);
var mathSeed = new BuiltinFunction("seed", (args, interpreter, callNode) => {
  expectNumber2(args[0], "seed", interpreter, callNode, 1);
  _currentSeed = Math.abs(Math.floor(args[0])) % 2147483647;
  if (_currentSeed === 0)
    _currentSeed = 1;
  return null;
}, 1);
var mathRandInt = new BuiltinFunction("randint", (args, interpreter, callNode) => {
  expectNumbers(args, "randint", 2, interpreter, callNode);
  const min = Math.ceil(args[0]);
  const max = Math.floor(args[1]);
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}, 2);
var mathModuleExports = {
  PI: MIMO_PI,
  E: MIMO_E,
  sin: mathSin,
  cos: mathCos,
  tan: mathTan,
  asin: mathAsin,
  acos: mathAcos,
  atan: mathAtan,
  atan2: mathAtan2,
  log: mathLog,
  log10: mathLog10,
  log2: mathLog2,
  exp: mathExp,
  pow: mathPow,
  sqrt: mathSqrt,
  cbrt: mathCbrt,
  floor: mathFloor,
  ceil: mathCeil,
  round: mathRound,
  abs: mathAbs,
  max: mathMax,
  min: mathMin,
  random: mathRandom,
  seed: mathSeed,
  randint: mathRandInt
};

// ../interpreter/stdlib/regex.js
function expectString4(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (typeof arg !== "string") {
    throw interpreter.errorHandler.createRuntimeError(`${funcName}() expects a string as argument ${argPosition}. Got '${typeof arg}'.`, callNode, "TYPE001");
  }
}
var regexMatch = new BuiltinFunction("find_matches", (args, interpreter, callNode) => {
  const [pattern, text, flags] = args;
  expectString4(pattern, "regex.find_matches", interpreter, callNode, 1);
  expectString4(text, "regex.find_matches", interpreter, callNode, 2);
  let flagsStr = "g";
  if (flags !== undefined) {
    expectString4(flags, "regex.find_matches", interpreter, callNode, 3);
    flagsStr = flags;
  }
  try {
    const re = new RegExp(pattern, flagsStr);
    const matches = text.match(re);
    if (!matches)
      return null;
    return [...matches];
  } catch (e) {
    throw interpreter.errorHandler.createRuntimeError(`Invalid regular expression: ${e.message}`, callNode, "REGEX001");
  }
}, [2, 3]);
var regexTest = new BuiltinFunction("is_match", (args, interpreter, callNode) => {
  const [pattern, text, flags] = args;
  expectString4(pattern, "regex.is_match", interpreter, callNode, 1);
  expectString4(text, "regex.is_match", interpreter, callNode, 2);
  const flagsStr = flags || "";
  try {
    const re = new RegExp(pattern, flagsStr);
    return re.test(text);
  } catch (e) {
    throw interpreter.errorHandler.createRuntimeError(`Invalid regular expression: ${e.message}`, callNode, "REGEX001");
  }
}, [2, 3]);
var regexReplace = new BuiltinFunction("replace_all", (args, interpreter, callNode) => {
  const [text, pattern, replacement, flags] = args;
  expectString4(text, "regex.replace_all", interpreter, callNode, 1);
  expectString4(pattern, "regex.replace_all", interpreter, callNode, 2);
  expectString4(replacement, "regex.replace_all", interpreter, callNode, 3);
  const flagsStr = flags || "g";
  try {
    const re = new RegExp(pattern, flagsStr);
    return text.replace(re, replacement);
  } catch (e) {
    throw interpreter.errorHandler.createRuntimeError(`Invalid regular expression: ${e.message}`, callNode, "REGEX001");
  }
}, [3, 4]);
var regexExec = new BuiltinFunction("extract", (args, interpreter, callNode) => {
  const [pattern, text, flags] = args;
  expectString4(pattern, "regex.extract", interpreter, callNode, 1);
  expectString4(text, "regex.extract", interpreter, callNode, 2);
  const flagsStr = flags || "";
  try {
    const re = new RegExp(pattern, flagsStr);
    const result = re.exec(text);
    if (!result)
      return null;
    const output = [...result];
    return output;
  } catch (e) {
    throw interpreter.errorHandler.createRuntimeError(`Invalid regular expression: ${e.message}`, callNode, "REGEX001");
  }
}, [2, 3]);
var regexModule = {
  find_matches: regexMatch,
  is_match: regexTest,
  replace_all: regexReplace,
  extract: regexExec
};

// ../interpreter/stdlib/string.js
function expectString5(arg, funcName, interpreter, callNode, argPosition = 1, allowEmpty = true) {
  if (typeof arg !== "string") {
    throw interpreter.errorHandler.createRuntimeError(`${funcName}() expects a string as argument ${argPosition}. Got '${typeof arg}'.`, callNode, "TYPE001", `Ensure argument ${argPosition} for '${funcName}' is a string.`);
  }
  if (!allowEmpty && arg === "") {
    throw interpreter.errorHandler.createRuntimeError(`${funcName}() argument ${argPosition} cannot be an empty string.`, callNode, "ARG001", `Provide a non-empty string for argument ${argPosition} of '${funcName}'.`);
  }
}
function expectStringOrNumber(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (typeof arg !== "string" && typeof arg !== "number") {
    throw interpreter.errorHandler.createRuntimeError(`${funcName}() expects a string or number as argument ${argPosition}. Got '${typeof arg}'.`, callNode, "TYPE001", `Ensure argument ${argPosition} for '${funcName}' is a string or number.`);
  }
}
function expectNumber3(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (typeof arg !== "number") {
    throw interpreter.errorHandler.createRuntimeError(`${funcName}() expects a number as argument ${argPosition}. Got '${typeof arg}'.`, callNode, "TYPE001", `Ensure argument ${argPosition} for '${funcName}' is a number.`);
  }
}
var strToUpper = new BuiltinFunction("to_upper", (args, interpreter, callNode) => {
  expectString5(args[0], "to_upper", interpreter, callNode, 1);
  return args[0].toUpperCase();
}, 1);
var strToLower = new BuiltinFunction("to_lower", (args, interpreter, callNode) => {
  expectString5(args[0], "to_lower", interpreter, callNode, 1);
  return args[0].toLowerCase();
}, 1);
var strToTitleCase = new BuiltinFunction("to_title_case", (args, interpreter, callNode) => {
  expectString5(args[0], "to_title_case", interpreter, callNode, 1);
  return args[0].toLowerCase().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}, 1);
var strCapitalize = new BuiltinFunction("capitalize", (args, interpreter, callNode) => {
  expectString5(args[0], "capitalize", interpreter, callNode, 1);
  return args[0].charAt(0).toUpperCase() + args[0].slice(1);
}, 1);
var strTrim = new BuiltinFunction("trim", (args, interpreter, callNode) => {
  expectString5(args[0], "trim", interpreter, callNode, 1);
  return args[0].trim();
}, 1);
var strTrimStart = new BuiltinFunction("trim_start", (args, interpreter, callNode) => {
  expectString5(args[0], "trim_start", interpreter, callNode, 1);
  return args[0].trimStart();
}, 1);
var strTrimEnd = new BuiltinFunction("trim_end", (args, interpreter, callNode) => {
  expectString5(args[0], "trim_end", interpreter, callNode, 1);
  return args[0].trimEnd();
}, 1);
var strPadStart = new BuiltinFunction("pad_start", (args, interpreter, callNode) => {
  expectString5(args[0], "pad_start", interpreter, callNode, 1);
  expectNumber3(args[1], "pad_start", interpreter, callNode, 2);
  const padString = args.length > 2 ? args[2] : " ";
  expectString5(padString, "pad_start", interpreter, callNode, 3);
  return args[0].padStart(args[1], padString);
}, [2, 3]);
var strPadEnd = new BuiltinFunction("pad_end", (args, interpreter, callNode) => {
  expectString5(args[0], "pad_end", interpreter, callNode, 1);
  expectNumber3(args[1], "pad_end", interpreter, callNode, 2);
  const padString = args.length > 2 ? args[2] : " ";
  expectString5(padString, "pad_end", interpreter, callNode, 3);
  return args[0].padEnd(args[1], padString);
}, [2, 3]);
var strContains = new BuiltinFunction("contains", (args, interpreter, callNode) => {
  expectString5(args[0], "contains", interpreter, callNode, 1);
  expectString5(args[1], "contains", interpreter, callNode, 2, false);
  const position = args.length > 2 ? args[2] : 0;
  expectNumber3(position, "contains", interpreter, callNode, 3);
  return args[0].includes(args[1], position);
}, [2, 3]);
var strStartsWith = new BuiltinFunction("starts_with", (args, interpreter, callNode) => {
  expectString5(args[0], "starts_with", interpreter, callNode, 1);
  expectString5(args[1], "starts_with", interpreter, callNode, 2);
  const position = args.length > 2 ? args[2] : 0;
  expectNumber3(position, "starts_with", interpreter, callNode, 3);
  return args[0].startsWith(args[1], position);
}, [2, 3]);
var strEndsWith = new BuiltinFunction("ends_with", (args, interpreter, callNode) => {
  expectString5(args[0], "ends_with", interpreter, callNode, 1);
  expectString5(args[1], "ends_with", interpreter, callNode, 2);
  const length = args.length > 2 ? args[2] : args[0].length;
  expectNumber3(length, "ends_with", interpreter, callNode, 3);
  return args[0].endsWith(args[1], length);
}, [2, 3]);
var strIndexOf = new BuiltinFunction("index_of", (args, interpreter, callNode) => {
  expectString5(args[0], "index_of", interpreter, callNode, 1);
  expectString5(args[1], "index_of", interpreter, callNode, 2);
  const fromIndex = args.length > 2 ? args[2] : 0;
  expectNumber3(fromIndex, "index_of", interpreter, callNode, 3);
  return args[0].indexOf(args[1], fromIndex);
}, [2, 3]);
var strLastIndexOf = new BuiltinFunction("last_index_of", (args, interpreter, callNode) => {
  expectString5(args[0], "last_index_of", interpreter, callNode, 1);
  expectString5(args[1], "last_index_of", interpreter, callNode, 2);
  const fromIndex = args.length > 2 ? args[2] : args[0].length - 1;
  expectNumber3(fromIndex, "last_index_of", interpreter, callNode, 3);
  return args[0].lastIndexOf(args[1], fromIndex);
}, [2, 3]);
var strSubstring = new BuiltinFunction("substring", (args, interpreter, callNode) => {
  expectString5(args[0], "substring", interpreter, callNode, 1);
  expectNumber3(args[1], "substring", interpreter, callNode, 2);
  const indexEnd = args.length > 2 ? args[2] : undefined;
  if (indexEnd !== undefined)
    expectNumber3(indexEnd, "substring", interpreter, callNode, 3);
  return args[0].substring(args[1], indexEnd);
}, [2, 3]);
var strSlice = new BuiltinFunction("slice", (args, interpreter, callNode) => {
  expectString5(args[0], "slice", interpreter, callNode, 1);
  expectNumber3(args[1], "slice", interpreter, callNode, 2);
  const endIndex = args.length > 2 ? args[2] : undefined;
  if (endIndex !== undefined)
    expectNumber3(endIndex, "slice", interpreter, callNode, 3);
  return args[0].slice(args[1], endIndex);
}, [2, 3]);
var strSplit = new BuiltinFunction("split", (args, interpreter, callNode) => {
  expectString5(args[0], "split", interpreter, callNode, 1);
  const separator = args.length > 1 ? args[1] : undefined;
  const limit = args.length > 2 ? args[2] : undefined;
  if (separator !== undefined)
    expectStringOrNumber(separator, "split", interpreter, callNode, 2);
  if (limit !== undefined)
    expectNumber3(limit, "split", interpreter, callNode, 3);
  return args[0].split(separator, limit);
}, [1, 3]);
var strReplace = new BuiltinFunction("replace", (args, interpreter, callNode) => {
  expectString5(args[0], "replace", interpreter, callNode, 1);
  expectStringOrNumber(args[1], "replace", interpreter, callNode, 2);
  expectString5(args[2], "replace", interpreter, callNode, 3);
  if (typeof args[1] !== "string") {
    throw interpreter.errorHandler.createRuntimeError("replace() pattern (arg 2) must be a string for Mimo's string.replace.", callNode, "TYPE001", "Provide a string for the pattern to replace.");
  }
  return args[0].replace(args[1], args[2]);
}, 3);
var strReplaceAll = new BuiltinFunction("replace_all", (args, interpreter, callNode) => {
  expectString5(args[0], "replace_all", interpreter, callNode, 1);
  expectStringOrNumber(args[1], "replace_all", interpreter, callNode, 2);
  expectString5(args[2], "replace_all", interpreter, callNode, 3);
  if (typeof args[1] !== "string") {
    throw interpreter.errorHandler.createRuntimeError("replace_all() pattern (arg 2) must be a string for Mimo's string.replace_all.", callNode, "TYPE001", "Provide a string for the pattern to replace.");
  }
  if (typeof String.prototype.replaceAll === "function") {
    return args[0].replaceAll(args[1], args[2]);
  } else {
    return args[0].split(args[1]).join(args[2]);
  }
}, 3);
var strRepeat = new BuiltinFunction("repeat", (args, interpreter, callNode) => {
  expectString5(args[0], "repeat", interpreter, callNode, 1);
  expectNumber3(args[1], "repeat", interpreter, callNode, 2);
  return args[0].repeat(args[1]);
}, 2);
var strCharAt = new BuiltinFunction("char_at", (args, interpreter, callNode) => {
  expectString5(args[0], "char_at", interpreter, callNode, 1);
  expectNumber3(args[1], "char_at", interpreter, callNode, 2);
  return args[0].charAt(args[1]);
}, 2);
var stringModuleExports = {
  to_upper: strToUpper,
  to_lower: strToLower,
  trim: strTrim,
  trim_start: strTrimStart,
  trim_end: strTrimEnd,
  pad_start: strPadStart,
  pad_end: strPadEnd,
  contains: strContains,
  starts_with: strStartsWith,
  ends_with: strEndsWith,
  index_of: strIndexOf,
  last_index_of: strLastIndexOf,
  substring: strSubstring,
  slice: strSlice,
  split: strSplit,
  replace: strReplace,
  replace_all: strReplaceAll,
  repeat: strRepeat,
  char_at: strCharAt,
  to_title_case: strToTitleCase,
  capitalize: strCapitalize
};

// ../interpreter/ModuleLoader.js
var internalStdLibModules = {
  array: arrayModule,
  datetime: datetimeModule,
  fs: fsModule,
  http: httpModule,
  json: jsonModule,
  math: mathModuleExports,
  regex: regexModule,
  string: stringModuleExports,
  assert: assertModule
};

class ModuleLoader {
  constructor(interpreter) {
    this.interpreter = interpreter;
    this.adapter = interpreter.adapter;
    this.moduleCache = new Map;
    this.loadingStack = new Set;
    this.executeModule = this.executeModule.bind(this);
  }
  loadModule(importPath, fromFile) {
    if (Object.hasOwn(internalStdLibModules, importPath)) {
      if (this.moduleCache.has(importPath)) {
        return this.moduleCache.get(importPath);
      }
      const exports = internalStdLibModules[importPath];
      this.moduleCache.set(importPath, exports);
      return exports;
    }
    const resolvedPath = this.resolvePath(importPath, fromFile);
    if (this.moduleCache.has(resolvedPath)) {
      return this.moduleCache.get(resolvedPath);
    }
    if (this.loadingStack.has(resolvedPath)) {
      const loadingChain = Array.from(this.loadingStack).join(" -> ");
      throw this.interpreter.errorHandler.createRuntimeError(`Circular module dependency detected: ${loadingChain} -> ${resolvedPath}.`, null, "MOD003", "Break the circular dependency by redesigning your module imports.");
    }
    this.loadingStack.add(resolvedPath);
    try {
      const exports = this.executeModule(resolvedPath);
      this.moduleCache.set(resolvedPath, exports);
      return exports;
    } finally {
      this.loadingStack.delete(resolvedPath);
    }
  }
  resolvePath(importPath, fromFile) {
    const dir = this.adapter.dirname(fromFile);
    const attemptedPaths = [];
    let resolved = this.adapter.resolvePath(dir, importPath);
    attemptedPaths.push(resolved);
    if (this.adapter.existsSync(resolved)) {
      return resolved;
    }
    resolved = this.adapter.resolvePath(dir, `${importPath}.mimo`);
    attemptedPaths.push(resolved);
    if (this.adapter.existsSync(resolved)) {
      return resolved;
    }
    throw this.interpreter.errorHandler.createRuntimeError(`Module '${importPath}' not found. Tried paths:
${attemptedPaths.map((p) => `  - ${p}`).join(`
`)}`, null, "MOD001", "Check the module path and ensure the file exists.");
  }
  executeModule(filePath) {
    if (!this.interpreter) {
      throw new Error("ModuleLoader critical error: interpreter instance is missing.");
    }
    const originalInterpreterEnv = this.interpreter.currentEnv;
    const originalInterpreterFile = this.interpreter.currentFile;
    try {
      const source = this.adapter.readFileSync(filePath, "utf8");
      const lexer = new Lexer(source, filePath);
      const tokens = [];
      let token;
      while ((token = lexer.nextToken()) !== null) {
        tokens.push(token);
      }
      const parser = new Parser(tokens, filePath);
      parser.setErrorHandler(this.interpreter.errorHandler);
      const ast = parser.parse();
      const moduleEnv = new Environment(this.interpreter.globalEnv);
      moduleEnv.isModuleRoot = true;
      this.interpreter.currentEnv = moduleEnv;
      this.interpreter.currentFile = filePath;
      this.interpreter.errorHandler.addSourceFile(filePath, source);
      let hasExplicitExports = false;
      for (const statement of ast.body) {
        if (statement.isExported === true) {
          hasExplicitExports = true;
          break;
        }
      }
      this.interpreter.visitNode(ast);
      const exports = {};
      if (hasExplicitExports) {
        for (const statement of ast.body) {
          if (statement.isExported === true) {
            if (statement.type === "FunctionDeclaration") {
              exports[statement.name] = moduleEnv.lookup(statement.name);
            } else if (statement.type === "VariableDeclaration") {
              exports[statement.identifier] = moduleEnv.lookup(statement.identifier);
            }
          }
        }
      } else {
        for (const [name, varInfo] of moduleEnv.vars.entries()) {
          exports[name] = varInfo.value;
        }
      }
      return exports;
    } catch (error) {
      if (error instanceof MimoError) {
        throw error;
      }
      throw this.interpreter.errorHandler.createRuntimeError(`Error loading module '${filePath}': ${error.message}`, null, "MOD004", "An unexpected error occurred while loading this module. Check its syntax or dependencies.");
    } finally {
      if (this.interpreter) {
        this.interpreter.currentEnv = originalInterpreterEnv;
        this.interpreter.currentFile = originalInterpreterFile;
        this.interpreter.errorHandler.clearSourceFile(filePath);
      }
    }
  }
  getModuleInfo(alias) {
    const moduleExports = this.interpreter.modules?.get(alias);
    if (!moduleExports) {
      return null;
    }
    return {
      alias,
      properties: Object.keys(moduleExports).sort()
    };
  }
}

// ../interpreter/executors/BaseExecutor.js
class BaseExecutor {
  constructor(interpreter) {
    this.interpreter = interpreter;
  }
  findFunctionScope(env) {
    let currentEnv = env;
    while (currentEnv && !currentEnv.isGlobalScope) {
      if (currentEnv.vars.size > 0) {
        return currentEnv;
      }
      currentEnv = currentEnv.parent;
    }
    return currentEnv || this.interpreter.globalEnv;
  }
  isFunctionScope(env) {
    return env.isFunctionContext;
  }
  executeProgram(node) {
    let result = null;
    for (const statement of node.body) {
      result = this.interpreter.visitNode(statement);
      if (result instanceof ReturnValue) {
        return result.value;
      }
    }
    return result;
  }
}

// ../interpreter/executors/VariableExecutor.js
class VariableExecutor extends BaseExecutor {
  executeVariableDeclaration(node) {
    const value = this.interpreter.visitNode(node.value);
    switch (node.kind) {
      case "global":
        this.interpreter.globalEnv.define(node.identifier, value, "global");
        break;
      case "let":
      case "const":
        this.interpreter.currentEnv.define(node.identifier, value, node.kind);
        break;
      default:
        const existingVarInfo = this.interpreter.currentEnv.getVariableInfo(node.identifier);
        if (existingVarInfo) {
          existingVarInfo.env.assign(node.identifier, value);
        } else {
          this.interpreter.currentEnv.define(node.identifier, value, "set");
        }
        return value;
    }
    return value;
  }
  executePropertyAssignment(node) {
    const targetObject = this.interpreter.visitNode(node.object);
    const valueToAssign = this.interpreter.visitNode(node.value);
    if (targetObject === null || typeof targetObject !== "object") {
      throw this.interpreter.errorHandler.createRuntimeError(`Cannot set property '${node.property}' on a non-object value (got ${typeof targetObject}).`, node.object, "TYPE004", "Ensure the target is an object before setting its properties.");
    }
    targetObject[node.property] = valueToAssign;
    return valueToAssign;
  }
  executeBracketAssignment(node) {
    const object = this.interpreter.visitNode(node.object);
    const index = this.interpreter.visitNode(node.index);
    const value = this.interpreter.visitNode(node.value);
    if (Array.isArray(object)) {
      if (typeof index !== "number" || !Number.isInteger(index)) {
        throw this.interpreter.errorHandler.createRuntimeError(`Array index for assignment must be an integer. Got '${typeof index}'.`, node.index, "TYPE001");
      }
      if (index < 0) {
        throw this.interpreter.errorHandler.createRuntimeError(`Array index cannot be negative. Got ${index}.`, node.index, "INDEX001");
      }
      object[index] = value;
      return value;
    }
    if (typeof object === "object" && object !== null) {
      const key = String(index);
      object[key] = value;
      return value;
    }
    throw this.interpreter.errorHandler.createRuntimeError(`Cannot set property on value of type '${typeof object}'.`, node.object, "TYPE002");
  }
  executeDestructuringAssignment(node) {
    const value = this.interpreter.visitNode(node.expression);
    const pattern = node.pattern;
    const assignOrDefine = (varNode, varValue) => {
      const varName = varNode.name;
      const existingVarInfo = this.interpreter.currentEnv.getVariableInfo(varName);
      if (existingVarInfo) {
        existingVarInfo.env.assign(varName, varValue);
      } else {
        this.interpreter.currentEnv.define(varName, varValue, "set");
      }
    };
    if (pattern.type === "ArrayPattern") {
      if (!Array.isArray(value)) {
        throw this.interpreter.errorHandler.createRuntimeError(`Cannot destructure non-array value into an array pattern.`, node.expression, "TYPE002");
      }
      pattern.elements.forEach((varNode, i) => {
        assignOrDefine(varNode, value[i] ?? null);
      });
    } else if (pattern.type === "ObjectPattern") {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw this.interpreter.errorHandler.createRuntimeError(`Cannot destructure non-object value into an object pattern.`, node.expression, "TYPE002");
      }
      pattern.properties.forEach((propIdentifierNode) => {
        const propName = propIdentifierNode.name;
        assignOrDefine(propIdentifierNode, value[propName] ?? null);
      });
    } else {
      throw this.interpreter.errorHandler.createRuntimeError(`Unsupported pattern type '${pattern.type}' for destructuring.`, pattern, "INT003");
    }
    return value;
  }
}

// ../interpreter/executors/ControlFlowExecutor.js
class ControlFlowExecutor extends BaseExecutor {
  executeIfStatement(node) {
    const condition = this.interpreter.visitNode(node.condition);
    if (isTruthy(condition)) {
      const blockEnv = new Environment(this.interpreter.currentEnv);
      return this.interpreter.executeBlock(node.consequent, blockEnv);
    }
    if (node.alternate) {
      if (node.alternate.type === "IfStatement") {
        return this.interpreter.visitNode(node.alternate);
      } else {
        const blockEnv = new Environment(this.interpreter.currentEnv);
        return this.interpreter.executeBlock(node.alternate, blockEnv);
      }
    }
    return null;
  }
  executeWhileStatement(node) {
    let result = null;
    while (isTruthy(this.interpreter.visitNode(node.condition))) {
      try {
        const blockEnv = new Environment(this.interpreter.currentEnv);
        result = this.interpreter.executeBlock(node.body, blockEnv);
        if (result instanceof ReturnValue) {
          return result;
        }
      } catch (exception) {
        if (exception instanceof BreakException) {
          break;
        }
        if (exception instanceof ContinueException) {
          continue;
        }
        throw exception;
      }
    }
    return result;
  }
  executeForStatement(node) {
    const iterable = this.interpreter.visitNode(node.iterable);
    if (!Array.isArray(iterable)) {
      throw this.interpreter.errorHandler.createRuntimeError(`For loop requires an iterable (array). Got '${typeof iterable}'.`, node.iterable, "TYPE001", 'Ensure the expression after "in" is an array.', this.interpreter.callStack);
    }
    const previousEnv = this.interpreter.currentEnv;
    this.interpreter.currentEnv = new Environment(previousEnv);
    let result = null;
    try {
      for (const item of iterable) {
        try {
          const iterationEnv = new Environment(this.interpreter.currentEnv);
          iterationEnv.define(node.variable.name, item);
          result = this.interpreter.executeBlock(node.body, iterationEnv);
          if (result instanceof ReturnValue) {
            return result;
          }
        } catch (exception) {
          if (exception instanceof BreakException) {
            break;
          }
          if (exception instanceof ContinueException) {
            continue;
          }
          throw exception;
        }
      }
    } finally {
      this.interpreter.currentEnv = previousEnv;
    }
    return result;
  }
  executeLoopStatement(node) {
    let result = null;
    while (true) {
      try {
        const blockEnv = new Environment(this.interpreter.currentEnv);
        result = this.interpreter.executeBlock(node.body, blockEnv);
        if (result instanceof ReturnValue) {
          return result;
        }
      } catch (exception) {
        if (exception instanceof BreakException) {
          break;
        }
        if (exception instanceof ContinueException) {
          continue;
        }
        throw exception;
      }
    }
    return result;
  }
  executeBreakStatement(node) {
    throw new BreakException(node.label);
  }
  executeContinueStatement(node) {
    throw new ContinueException(node.label);
  }
  executeTryStatement(node) {
    try {
      const tryEnv = new Environment(this.interpreter.currentEnv);
      return this.interpreter.executeBlock(node.tryBlock, tryEnv);
    } catch (error) {
      if (node.catchVar && node.catchBlock) {
        const catchEnv = new Environment(this.interpreter.currentEnv);
        const errorValue = error instanceof MimoError ? error : this.interpreter.errorHandler.createRuntimeError(`Unhandled JavaScript error: ${error.message}`, node, "INT005", "An unexpected error occurred during execution. This indicates a bug in the Mimo interpreter, or an unhandled case. Please report this error.");
        catchEnv.define(node.catchVar.name, errorValue);
        return this.interpreter.executeBlock(node.catchBlock, catchEnv);
      }
      throw error;
    }
  }
}

// ../interpreter/executors/FunctionExecutor.js
class FunctionExecutor extends BaseExecutor {
  executeFunctionDeclaration(node) {
    const func = new FunctionValue(node, this.interpreter.currentEnv);
    this.interpreter.currentEnv.define(node.name, func);
    return null;
  }
  executeCallStatement(node) {
    let func;
    let functionName;
    if (typeof node.callee === "string") {
      func = this.interpreter.currentEnv.lookup(node.callee);
      functionName = node.callee;
    } else {
      func = this.interpreter.visitNode(node.callee);
      if (node.callee.type === "ModuleAccess") {
        functionName = `${node.callee.module}.${node.callee.property}`;
      } else if (node.callee.type === "Identifier") {
        functionName = node.callee.name;
      } else {
        functionName = "<anonymous function>";
      }
    }
    if (!(func instanceof FunctionValue) && !(func instanceof BuiltinFunction)) {
      throw this.interpreter.errorHandler.createRuntimeError(`'${functionName}' is not a callable function.`, node, "TYPE002", "Ensure you are calling a function or method.");
    }
    const args = node.arguments.map((arg) => this.interpreter.visitNode(arg));
    const result = func.call(this.interpreter, args, node);
    if (node.destination) {
      this.interpreter.currentEnv.define(node.destination.name, result);
    }
    return result;
  }
  executeReturnStatement(node) {
    const value = node.argument ? this.interpreter.visitNode(node.argument) : null;
    return new ReturnValue(value);
  }
  executeShowStatement(node) {
    const value = this.interpreter.visitNode(node.expression);
    const rendered = stringify(value);
    if (this.interpreter.adapter && typeof this.interpreter.adapter.log === "function") {
      this.interpreter.adapter.log(rendered);
    } else {
      console.log(rendered);
    }
    return value;
  }
  executeThrowStatement(node) {
    const value = this.interpreter.visitNode(node.argument);
    throw this.interpreter.errorHandler.createRuntimeError(stringify(value), node, "USER001", 'This error was thrown by the "throw" statement.');
  }
}

// ../interpreter/executors/PatternMatchExecutor.js
class PatternMatchExecutor extends BaseExecutor {
  executeMatchStatement(node) {
    const discriminant = this.interpreter.visitNode(node.discriminant);
    for (const caseClause of node.cases) {
      const bindings = {};
      if (this.matchesPattern(discriminant, caseClause.pattern, bindings)) {
        const caseEnv = new Environment(this.interpreter.currentEnv);
        for (const [name, value] of Object.entries(bindings)) {
          caseEnv.define(name, value, "let");
        }
        return this.interpreter.executeBlock(caseClause.consequent, caseEnv);
      }
    }
    throw this.interpreter.errorHandler.createRuntimeError(`No matching pattern found for value: ${stringify(discriminant)}`, node.discriminant, "MATCH001", `Add an 'default:' clause or ensure all possible values are covered by 'case' clauses.`);
  }
  matchesPattern(value, pattern, bindings = {}) {
    if (pattern === null) {
      return true;
    }
    switch (pattern.type) {
      case "Literal":
        return value === pattern.value;
      case "Identifier":
        bindings[pattern.name] = value;
        return true;
      case "ArrayPattern":
        if (!Array.isArray(value)) {
          return false;
        }
        if (value.length !== pattern.elements.length) {
          return false;
        }
        for (let i = 0;i < pattern.elements.length; i++) {
          if (!this.matchesPattern(value[i], pattern.elements[i], bindings)) {
            return false;
          }
        }
        return true;
      default:
        throw this.interpreter.errorHandler.createRuntimeError(`Internal error: Unknown pattern type '${pattern.type}' encountered during matching.`, pattern, "INT003", "This indicates a bug in the Mimo interpreter. Please report this error.");
    }
  }
}

// ../interpreter/StatementExecutor.js
class StatementExecutor {
  constructor(interpreter) {
    this.interpreter = interpreter;
    this.baseExecutor = new BaseExecutor(interpreter);
    this.variableExecutor = new VariableExecutor(interpreter);
    this.controlFlowExecutor = new ControlFlowExecutor(interpreter);
    this.functionExecutor = new FunctionExecutor(interpreter);
    this.patternMatchExecutor = new PatternMatchExecutor(interpreter);
  }
  executeStatement(node) {
    switch (node.type) {
      case "Program":
        return this.baseExecutor.executeProgram(node);
      case "VariableDeclaration":
        return this.variableExecutor.executeVariableDeclaration(node);
      case "DestructuringAssignment":
        return this.variableExecutor.executeDestructuringAssignment(node);
      case "PropertyAssignment":
        return this.variableExecutor.executePropertyAssignment(node);
      case "BracketAssignment":
        return this.variableExecutor.executeBracketAssignment(node);
      case "IfStatement":
        return this.controlFlowExecutor.executeIfStatement(node);
      case "WhileStatement":
        return this.controlFlowExecutor.executeWhileStatement(node);
      case "ForStatement":
        return this.controlFlowExecutor.executeForStatement(node);
      case "LoopStatement":
        return this.controlFlowExecutor.executeLoopStatement(node);
      case "BreakStatement":
        return this.controlFlowExecutor.executeBreakStatement(node);
      case "ContinueStatement":
        return this.controlFlowExecutor.executeContinueStatement(node);
      case "TryStatement":
        return this.controlFlowExecutor.executeTryStatement(node);
      case "FunctionDeclaration":
        return this.functionExecutor.executeFunctionDeclaration(node);
      case "CallStatement":
        return this.functionExecutor.executeCallStatement(node);
      case "ReturnStatement":
        return this.functionExecutor.executeReturnStatement(node);
      case "ShowStatement":
        return this.functionExecutor.executeShowStatement(node);
      case "ThrowStatement":
        return this.functionExecutor.executeThrowStatement(node);
      case "MatchStatement":
        return this.patternMatchExecutor.executeMatchStatement(node);
      case "ImportStatement":
        return this.executeImportStatement(node);
      default:
        throw this.interpreter.errorHandler.createRuntimeError(`Unknown statement type: ${node.type}`, node, "RUN000", "This indicates a bug in the interpreter. Please report this error.");
    }
  }
  executeImportStatement(node) {
    try {
      const exports = this.interpreter.moduleLoader.loadModule(node.path, this.interpreter.currentFile);
      this.interpreter.currentEnv.define(node.alias, exports, "const");
    } catch (error) {
      if (error instanceof MimoError) {
        throw error;
      }
      throw this.interpreter.errorHandler.createRuntimeError(error.message, node, "MOD001", "Check if the module path is correct and the module exists.");
    }
    return null;
  }
}

// ../interpreter/Interpreter.js
class Interpreter {
  constructor(adapter) {
    this.adapter = adapter;
    this.globalEnv = new Environment(null, true);
    this.currentEnv = this.globalEnv;
    this.expressionEvaluator = new ExpressionEvaluator(this);
    this.statementExecutor = new StatementExecutor(this);
    this.moduleLoader = new ModuleLoader(this);
    this.currentFile = "/repl";
    this.errorHandler = new ErrorHandler;
    this.callStack = [];
    initializeBuiltins(this.globalEnv);
    initializeArrayModule(this.globalEnv);
  }
  interpret(ast, filePath = "main.mimo") {
    const previousCurrentFile = this.currentFile;
    this.currentFile = filePath;
    try {
      this.pushCallStack("<root>", ast);
      const result = this.visitNode(ast);
      return result;
    } catch (error) {
      if (error instanceof MimoError) {
        throw error;
      } else {
        const lastFrameNode = this.callStack.length > 0 ? this.callStack[this.callStack.length - 1].node : ast;
        const mimoError = this.errorHandler.createRuntimeError(`Internal JavaScript error: ${error.message}`, lastFrameNode, "INT001", "An unexpected internal error occurred. This might be a bug in the Mimo interpreter.", this.callStack);
        throw mimoError;
      }
    } finally {
      this.popCallStack();
      this.currentFile = previousCurrentFile;
    }
  }
  pushCallStack(functionName, node) {
    if (node && node.line !== undefined && node.column !== undefined && node.file !== undefined) {
      this.callStack.push({
        functionName: functionName || "<anonymous>",
        file: node.file,
        line: node.line,
        column: node.column,
        node
      });
    }
  }
  popCallStack() {
    this.callStack.pop();
  }
  visitNode(node) {
    if (this.isExpression(node)) {
      return this.expressionEvaluator.evaluateExpression(node);
    }
    return this.statementExecutor.executeStatement(node);
  }
  isExpression(node) {
    const expressionTypes = [
      "BinaryExpression",
      "UnaryExpression",
      "Identifier",
      "Literal",
      "ArrayLiteral",
      "ArrayAccess",
      "ObjectLiteral",
      "PropertyAccess",
      "SafePropertyAccess",
      "ModuleAccess",
      "AnonymousFunction",
      "TemplateLiteral",
      "CallExpression"
    ];
    return expressionTypes.includes(node.type);
  }
  executeBlock(statements, env = null) {
    const previousEnv = this.currentEnv;
    if (env) {
      this.currentEnv = env;
    }
    try {
      let result = null;
      for (const statement of statements) {
        result = this.visitNode(statement);
        if (result instanceof ReturnValue) {
          return result;
        }
      }
      return result;
    } finally {
      if (env) {
        this.currentEnv = previousEnv;
      }
    }
  }
}
// ../index.web.js
class MimoTokenizer {
  constructor(source, filePath = "/playground.mimo") {
    this.source = source;
    this.filePath = filePath;
    this.lexer = new Lexer(source, filePath);
  }
  tokenize() {
    const tokens = [];
    let token;
    while ((token = this.lexer.nextToken()) !== null) {
      tokens.push(token);
    }
    return tokens;
  }
}

class MimoParser {
  constructor(tokens, filePath = "/playground.mimo", errorHandler = null) {
    this.tokens = tokens;
    this.filePath = filePath;
    this.parser = new Parser(tokens, filePath);
    if (errorHandler) {
      this.parser.setErrorHandler(errorHandler);
    }
  }
  parse() {
    return this.parser.parse();
  }
}

class ASTHookManager {
  constructor() {
    this.hooks = [];
  }
  registerHook(callback, name = null) {
    if (typeof callback !== "function") {
      throw new Error("AST hook must be a function");
    }
    const hook = {
      callback,
      name: name || `hook_${this.hooks.length}`,
      id: Date.now() + Math.random()
    };
    this.hooks.push(hook);
    return hook.id;
  }
  unregisterHook(hookId) {
    this.hooks = this.hooks.filter((hook) => hook.id !== hookId);
  }
  unregisterHooksByName(name) {
    this.hooks = this.hooks.filter((hook) => hook.name !== name);
  }
  clearHooks() {
    this.hooks = [];
  }
  executeHooks(ast, filePath) {
    for (const hook of this.hooks) {
      try {
        hook.callback(ast, filePath);
      } catch (error) {
        console.error(`Error in AST hook '${hook.name}':`, error);
      }
    }
  }
  getHooks() {
    return this.hooks.map((hook) => ({
      id: hook.id,
      name: hook.name
    }));
  }
}

class Mimo {
  constructor(adapter, options = {}) {
    if (!adapter) {
      throw new Error("Mimo constructor requires an adapter object.");
    }
    this.interpreter = new Interpreter(adapter);
    this.astHookManager = new ASTHookManager;
    this.options = {
      enableASTHooks: options.enableASTHooks !== false,
      throwOnHookError: options.throwOnHookError || false,
      ...options
    };
  }
  onAST(callback, name) {
    return this.astHookManager.registerHook(callback, name);
  }
  offAST(hookId) {
    this.astHookManager.unregisterHook(hookId);
  }
  getASTHookManager() {
    return this.astHookManager;
  }
  tokenize(source, filePath = "/playground.mimo") {
    const tokenizer = new MimoTokenizer(source, filePath);
    return tokenizer.tokenize();
  }
  parse(tokens, filePath = "/playground.mimo") {
    const parser = new MimoParser(tokens, filePath, this.interpreter.errorHandler);
    this.interpreter.errorHandler.addSourceFile(filePath, "");
    return parser.parse();
  }
  parseSource(source, filePath = "/playground.mimo") {
    const tokens = this.tokenize(source, filePath);
    this.interpreter.errorHandler.addSourceFile(filePath, source);
    const parser = new MimoParser(tokens, filePath, this.interpreter.errorHandler);
    const ast = parser.parse();
    if (this.options.enableASTHooks) {
      this.astHookManager.executeHooks(ast, filePath);
    }
    return ast;
  }
  run(source, filePath = "/playground.mimo") {
    const effectivePath = filePath;
    try {
      const tokens = this.tokenize(source, effectivePath);
      const ast = this.parseSource(source, effectivePath);
      const result = this.interpreter.interpret(ast, effectivePath);
      return result;
    } catch (error) {
      if (error instanceof MimoError) {
        throw error.format(this.interpreter.errorHandler.getLine(error.location.file, error.location.line));
      } else {
        throw error;
      }
    }
  }
  runAST(ast, filePath = "/playground.mimo") {
    try {
      return this.interpreter.interpret(ast, filePath);
    } catch (error) {
      if (error instanceof MimoError) {
        throw error.format(this.interpreter.errorHandler.getLine(error.location.file, error.location.line));
      } else {
        throw error;
      }
    }
  }
}

// ../adapters/browserAdapter.js
function fsUnavailable() {
  throw new Error("File system access is not available in the browser environment.");
}
var baseBrowserAdapter = {
  readFileSync: fsUnavailable,
  readdirSync: fsUnavailable,
  existsSync: () => false,
  writeFileSync: fsUnavailable,
  mkdirSync: fsUnavailable,
  unlinkSync: fsUnavailable,
  rmdirSync: fsUnavailable,
  rmSync: fsUnavailable,
  resolvePath: (...segments) => segments.join("/").replace(/\/+/g, "/"),
  dirname: (filePath) => {
    const lastSlash = filePath.lastIndexOf("/");
    return lastSlash === -1 ? "." : filePath.substring(0, lastSlash);
  },
  isAbsolutePath: (filePath) => filePath.startsWith("/"),
  joinPath: (...segments) => segments.join("/"),
  basename: (filePath) => {
    const lastSlash = filePath.lastIndexOf("/");
    return filePath.substring(lastSlash + 1);
  },
  fetchSync: (url, options = {}) => {
    try {
      const xhr = new XMLHttpRequest;
      xhr.open(options.method || "GET", url, false);
      if (options.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          xhr.setRequestHeader(key, value);
        }
      }
      xhr.send(options.body || null);
      return {
        status: xhr.status,
        body: xhr.responseText
      };
    } catch (e) {
      throw new Error("HTTP request failed: " + e.message);
    }
  },
  getArguments: () => [],
  getEnvVariable: () => null,
  exit: (code) => {
    console.warn(`Mimo script called exit(${code}), but exit is disabled in the browser.`);
  },
  cwd: () => "/",
  log: (...args) => console.log(...args),
  error: (...args) => console.error(...args)
};
function createBrowserAdapter(overrides = {}) {
  return { ...baseBrowserAdapter, ...overrides };
}
var browserAdapter = createBrowserAdapter();
export {
  createBrowserAdapter,
  browserAdapter,
  Mimo
};
