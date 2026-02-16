import { BuiltinFunction } from "../BuiltinFunction.js";

// --- Helper Functions ---
function expectString(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (typeof arg !== "string") {
    throw interpreter.errorHandler.createRuntimeError(
      `${funcName}() expects a string as argument ${argPosition}. Got '${typeof arg}'.`,
      callNode,
      "TYPE001",
    );
  }
}

// --- BuiltinFunction Definitions ---

const regexMatch = new BuiltinFunction(
  "find_matches",
  (args, interpreter, callNode) => {
    const [pattern, text, flags] = args;
    expectString(pattern, "regex.find_matches", interpreter, callNode, 1);
    expectString(text, "regex.find_matches", interpreter, callNode, 2);

    let flagsStr = "g"; // Default to global match if not specified
    if (flags !== undefined) {
      expectString(flags, "regex.find_matches", interpreter, callNode, 3);
      flagsStr = flags;
    }

    try {
      const re = new RegExp(pattern, flagsStr);
      const matches = text.match(re);

      if (!matches) return null;

      // text.match with global flag returns array of strings.
      // text.match without global flag returns object with capturing groups.
      // For simplicity in Mimo, let's return a standard array of strings.
      return [...matches];
    } catch (e) {
      throw interpreter.errorHandler.createRuntimeError(
        `Invalid regular expression: ${e.message}`,
        callNode,
        "REGEX001",
      );
    }
  },
  [2, 3], // pattern, text, [flags]
);

const regexTest = new BuiltinFunction(
  "is_match",
  (args, interpreter, callNode) => {
    const [pattern, text, flags] = args;
    expectString(pattern, "regex.is_match", interpreter, callNode, 1);
    expectString(text, "regex.is_match", interpreter, callNode, 2);

    const flagsStr = flags || "";

    try {
      const re = new RegExp(pattern, flagsStr);
      return re.test(text);
    } catch (e) {
      throw interpreter.errorHandler.createRuntimeError(
        `Invalid regular expression: ${e.message}`,
        callNode,
        "REGEX001",
      );
    }
  },
  [2, 3],
);

const regexReplace = new BuiltinFunction(
  "replace_all",
  (args, interpreter, callNode) => {
    const [text, pattern, replacement, flags] = args;
    expectString(text, "regex.replace_all", interpreter, callNode, 1);
    expectString(pattern, "regex.replace_all", interpreter, callNode, 2);
    expectString(replacement, "regex.replace_all", interpreter, callNode, 3);

    // Default to 'g' (replace all) which is usually what people want in regex replace
    const flagsStr = flags || "g";

    try {
      const re = new RegExp(pattern, flagsStr);
      return text.replace(re, replacement);
    } catch (e) {
      throw interpreter.errorHandler.createRuntimeError(
        `Invalid regular expression: ${e.message}`,
        callNode,
        "REGEX001",
      );
    }
  },
  [3, 4], // text, pattern, replacement, [flags]
);

// Returns the first match and its capturing groups
const regexExec = new BuiltinFunction(
  "extract",
  (args, interpreter, callNode) => {
    const [pattern, text, flags] = args;
    expectString(pattern, "regex.extract", interpreter, callNode, 1);
    expectString(text, "regex.extract", interpreter, callNode, 2);

    const flagsStr = flags || "";

    try {
      const re = new RegExp(pattern, flagsStr);
      const result = re.exec(text);

      if (!result) return null;

      // Convert the special RegEx result object/array to a clean Mimo array
      // Index 0 is full match, 1+ are groups
      const output = [...result];
      return output;
    } catch (e) {
      throw interpreter.errorHandler.createRuntimeError(
        `Invalid regular expression: ${e.message}`,
        callNode,
        "REGEX001",
      );
    }
  },
  [2, 3],
);

export const regexModule = {
  find_matches: regexMatch,
  is_match: regexTest,
  replace_all: regexReplace,
  extract: regexExec,
};
