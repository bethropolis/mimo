import { BuiltinFunction } from "../BuiltinFunction.js";

function expectString(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (typeof arg !== "string") {
    throw interpreter.errorHandler.createRuntimeError(
      `${funcName}() expects a string as argument ${argPosition}. Got '${typeof arg}'.`,
      callNode,
      "TYPE001",
      "Provide an environment variable name as a string."
    );
  }
}

const envGet = new BuiltinFunction(
  "get",
  ([name, fallback], interpreter, callNode) => {
    expectString(name, "env.get", interpreter, callNode, 1);
    const value = interpreter.adapter.getEnvVariable(name);
    if (value === undefined || value === null) {
      return fallback === undefined ? null : fallback;
    }
    return value;
  },
  [1, 2]
);

const envHas = new BuiltinFunction(
  "has",
  ([name], interpreter, callNode) => {
    expectString(name, "env.has", interpreter, callNode, 1);
    const value = interpreter.adapter.getEnvVariable(name);
    return value !== undefined && value !== null;
  },
  1
);

const envAll = new BuiltinFunction(
  "all",
  (args, interpreter) => {
    const adapterAll = interpreter.adapter.getEnvAll;
    if (typeof adapterAll === "function") {
      return adapterAll();
    }
    return {};
  },
  0
);

export const envModule = {
  get: envGet,
  has: envHas,
  all: envAll,
};

