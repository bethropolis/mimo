import { BuiltinFunction } from "../BuiltinFunction.js";

// --- Helper Functions ---
function expectString(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (typeof arg !== "string") {
    throw interpreter.errorHandler.createRuntimeError(
      `${funcName}() expects a string path as argument ${argPosition}. Got '${typeof arg}'.`,
      callNode,
      "TYPE001",
      'Provide a string path (e.g., "./my_file.txt").'
    );
  }
}

// --- BuiltinFunction Definitions ---

const fsReadFile = new BuiltinFunction(
  "read_file",
  ([filePath], interpreter, callNode) => {
    expectString(filePath, "fs.read_file", interpreter, callNode);
    try {
      return interpreter.adapter.readFileSync(filePath, "utf-8");
    } catch (e) {
      throw interpreter.errorHandler.createRuntimeError(
        `Failed to read file '${filePath}': ${e.message}`,
        callNode,
        "FS001",
        "Ensure the file exists and you have read permissions."
      );
    }
  },
  1
);

const fsWriteFile = new BuiltinFunction(
  "write_file",
  ([filePath, content], interpreter, callNode) => {
    expectString(filePath, "fs.write_file", interpreter, callNode, 1);
    if (typeof content !== "string") {
      throw interpreter.errorHandler.createRuntimeError(
        "fs.write_file() expects string content as its second argument.",
        callNode,
        "TYPE001",
        "Provide the string content to write to the file."
      );
    }
    try {
      interpreter.adapter.writeFileSync(filePath, content, "utf-8");
      return null;
    } catch (e) {
      throw interpreter.errorHandler.createRuntimeError(
        `Failed to write to file '${filePath}': ${e.message}`,
        callNode,
        "FS002",
        "Ensure you have write permissions for the directory."
      );
    }
  },
  2
);

const fsFileExists = new BuiltinFunction(
  "exists",
  ([filePath], interpreter, callNode) => {
    expectString(filePath, "fs.exists", interpreter, callNode);
    return interpreter.adapter.existsSync(filePath);
  },
  1
);

const fsListDir = new BuiltinFunction(
  "list_dir",
  ([dirPath], interpreter, callNode) => {
    expectString(dirPath, "fs.list_dir", interpreter, callNode);
    try {
      return interpreter.adapter.readdirSync(dirPath);
    } catch (e) {
      throw interpreter.errorHandler.createRuntimeError(
        `Failed to list directory '${dirPath}': ${e.message}`,
        callNode,
        "FS003",
        "Ensure the path is a directory and you have read permissions."
      );
    }
  },
  1
);

const fsMakeDir = new BuiltinFunction(
  "make_dir",
  ([dirPath, recursive], interpreter, callNode) => {
    expectString(dirPath, "fs.make_dir", interpreter, callNode);
    const recursiveOption = recursive === true; // Only `true` is recursive
    try {
      interpreter.adapter.mkdirSync(dirPath, { recursive: recursiveOption });
      return true;
    } catch (e) {
      throw interpreter.errorHandler.createRuntimeError(
        `Failed to create directory '${dirPath}': ${e.message}`,
        callNode,
        "FS004",
        "Ensure the parent directory exists and you have write permissions."
      );
    }
  },
  [1, 2] // dirPath, [recursive: boolean]
);

const fsRemoveFile = new BuiltinFunction(
  "remove_file",
  ([filePath], interpreter, callNode) => {
    expectString(filePath, "fs.remove_file", interpreter, callNode);
    try {
      interpreter.adapter.unlinkSync(filePath);
      return true;
    } catch (e) {
      throw interpreter.errorHandler.createRuntimeError(
        `Failed to remove file '${filePath}': ${e.message}`,
        callNode,
        "FS005",
        "Ensure the file exists and you have write permissions."
      );
    }
  },
  1
);

const fsRemoveDir = new BuiltinFunction(
  "remove_dir",
  ([dirPath, recursive], interpreter, callNode) => {
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
      throw interpreter.errorHandler.createRuntimeError(
        `Failed to remove directory '${dirPath}': ${e.message}`,
        callNode,
        "FS006",
        "Ensure the directory exists and you have write permissions. Use the recursive option for non-empty directories."
      );
    }
  },
  [1, 2] // dirPath, [recursive: boolean]
);

// --- Module Export ---
export const fsModule = {
  read_file: fsReadFile,
  write_file: fsWriteFile,
  exists: fsFileExists,
  list_dir: fsListDir,
  make_dir: fsMakeDir,
  remove_file: fsRemoveFile,
  remove_dir: fsRemoveDir,
};
