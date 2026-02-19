import { BuiltinFunction } from '../BuiltinFunction.js';

// --- Helper Functions ---

function expectString(arg, funcName, interpreter, callNode) {
    if (typeof arg !== 'string') {
        throw interpreter.errorHandler.createRuntimeError(
            `${funcName}() expects a JSON string as its argument.`,
            callNode, 'TYPE001', 'Provide a string containing valid JSON.'
        );
    }
}

// --- BuiltinFunction Definitions ---

const jsonParse = new BuiltinFunction("parse",
    ([jsonString], interpreter, callNode) => {
        expectString(jsonString, "json.parse", interpreter, callNode);
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            throw interpreter.errorHandler.createRuntimeError(
                `Failed to parse JSON string: ${e.message}`,
                callNode, 'JSON001', 'Ensure the string contains valid JSON syntax.'
            );
        }
    },
    1
);

const jsonStringify = new BuiltinFunction("stringify",
    (args, interpreter, callNode) => {
        const [value, indent] = args;
        let indentArg = null;

        if (args.length > 1) {
            if (typeof indent !== "number" && typeof indent !== "string") {
                throw interpreter.errorHandler.createRuntimeError(
                    "json.stringify() second argument (indent) must be a number or a string.",
                    callNode, 'TYPE001', 'Provide a number for spaces or a string for the indent characters.'
                );
            }
            if (typeof indent === "number" && indent < 0) {
                throw interpreter.errorHandler.createRuntimeError(
                    "json.stringify() indent number must be non-negative.",
                    callNode, 'ARG001', 'Provide a non-negative number for indentation.'
                );
            }
            indentArg = indent;
        }

        try {
            // The `null` replacer argument is standard for JSON.stringify
            return JSON.stringify(value, null, indentArg);
        } catch (e) {
            throw interpreter.errorHandler.createRuntimeError(
                `Failed to stringify value to JSON: ${e.message}`,
                callNode, 'JSON001', 'Ensure the value can be serialized to JSON (e.g., no functions or circular references).'
            );
        }
    },
    [1, 2] // Arity: value, [indent]
);


// --- Module Export ---
export const jsonModule = {
    parse: jsonParse,
    stringify: jsonStringify,
};
