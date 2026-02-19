import { BuiltinFunction } from "../BuiltinFunction.js";

// --- Helper Functions ---
function expectString(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (typeof arg !== "string") {
    throw interpreter.errorHandler.createRuntimeError(
      `${funcName}() expects a string as argument ${argPosition}. Got '${typeof arg}'.`,
      callNode,
      "TYPE001",
      "Provide a URL string.",
    );
  }
}

function expectObject(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (typeof arg !== "object" || arg === null || Array.isArray(arg)) {
    throw interpreter.errorHandler.createRuntimeError(
      `${funcName}() expects an object as argument ${argPosition}.`,
      callNode,
      "TYPE001",
    );
  }
}

// --- BuiltinFunction Definitions ---

const httpGet = new BuiltinFunction(
  "get",
  (args, interpreter, callNode) => {
    const [url] = args;
    expectString(url, "http.get", interpreter, callNode, 1);

    try {
      // Call the adapter's synchronous fetch
      return interpreter.adapter.fetchSync(url, { method: "GET" });
    } catch (e) {
      throw interpreter.errorHandler.createRuntimeError(
        `HTTP GET request failed: ${e.message}`,
        callNode,
        "HTTP001",
      );
    }
  },
  1, // Arity: 1 argument (url)
);

const httpPost = new BuiltinFunction(
  "post",
  (args, interpreter, callNode) => {
    const [url, body, headers] = args;
    expectString(url, "http.post", interpreter, callNode, 1);

    // Mimo allows sending string bodies directly.
    // If the user has an object, they should use json.stringify() first.
    if (typeof body !== "string") {
      throw interpreter.errorHandler.createRuntimeError(
        `http.post() body must be a string. Use json.stringify(data) first.`,
        callNode,
        "TYPE001",
      );
    }

    let requestHeaders = { "Content-Type": "application/json" };

    if (headers !== undefined) {
      expectObject(headers, "http.post", interpreter, callNode, 3);
      // Merge defaults with user headers
      requestHeaders = { ...requestHeaders, ...headers };
    }

    try {
      return interpreter.adapter.fetchSync(url, {
        method: "POST",
        body: body,
        headers: requestHeaders,
      });
    } catch (e) {
      throw interpreter.errorHandler.createRuntimeError(
        `HTTP POST request failed: ${e.message}`,
        callNode,
        "HTTP002",
      );
    }
  },
  [2, 3], // Arity: url, body, [headers]
);

// --- Module Export ---
export const httpModule = {
  get: httpGet,
  post: httpPost,
};
