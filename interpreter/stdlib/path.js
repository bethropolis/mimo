import { BuiltinFunction } from "../BuiltinFunction.js";

function expectString(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (typeof arg !== "string") {
    throw interpreter.errorHandler.createRuntimeError(
      `${funcName}() expects a string as argument ${argPosition}. Got '${typeof arg}'.`,
      callNode,
      "TYPE001",
      "Provide a string path value."
    );
  }
}

const pathJoin = new BuiltinFunction(
  "join",
  (args, interpreter, callNode) => {
    if (args.length === 0) {
      throw interpreter.errorHandler.createRuntimeError(
        "path.join() expects at least one argument.",
        callNode,
        "BUILTIN001",
        "Provide one or more path segments."
      );
    }
    args.forEach((segment, index) =>
      expectString(segment, "path.join", interpreter, callNode, index + 1)
    );
    return interpreter.adapter.joinPath(...args);
  },
  [1, Infinity]
);

const pathDirname = new BuiltinFunction(
  "dirname",
  ([targetPath], interpreter, callNode) => {
    expectString(targetPath, "path.dirname", interpreter, callNode, 1);
    return interpreter.adapter.dirname(targetPath);
  },
  1
);

const pathBasename = new BuiltinFunction(
  "basename",
  ([targetPath, ext], interpreter, callNode) => {
    expectString(targetPath, "path.basename", interpreter, callNode, 1);
    if (ext !== undefined) {
      expectString(ext, "path.basename", interpreter, callNode, 2);
    }
    return interpreter.adapter.basename(targetPath, ext);
  },
  [1, 2]
);

const pathExtname = new BuiltinFunction(
  "extname",
  ([targetPath], interpreter, callNode) => {
    expectString(targetPath, "path.extname", interpreter, callNode, 1);
    return interpreter.adapter.extname(targetPath);
  },
  1
);

export const pathModule = {
  join: pathJoin,
  dirname: pathDirname,
  basename: pathBasename,
  extname: pathExtname,
};

