import { BuiltinFunction } from '../BuiltinFunction.js';

// --- Helper for type checking ---
function expectString(arg, funcName, interpreter, callNode, argPosition = 1, allowEmpty = true) {
    if (typeof arg !== 'string') {
        throw interpreter.errorHandler.createRuntimeError(
            `${funcName}() expects a string as argument ${argPosition}. Got '${typeof arg}'.`,
            callNode,
            'TYPE001',
            `Ensure argument ${argPosition} for '${funcName}' is a string.`
        );
    }
    if (!allowEmpty && arg === "") {
        throw interpreter.errorHandler.createRuntimeError(
            `${funcName}() argument ${argPosition} cannot be an empty string.`,
            callNode,
            'ARG001',
            `Provide a non-empty string for argument ${argPosition} of '${funcName}'.`
        );
    }
}

function expectStringOrNumber(arg, funcName, interpreter, callNode, argPosition = 1) {
    if (typeof arg !== 'string' && typeof arg !== 'number') {
        throw interpreter.errorHandler.createRuntimeError(
            `${funcName}() expects a string or number as argument ${argPosition}. Got '${typeof arg}'.`,
            callNode,
            'TYPE001',
            `Ensure argument ${argPosition} for '${funcName}' is a string or number.`
        );
    }
}

function expectNumber(arg, funcName, interpreter, callNode, argPosition = 1) {
    if (typeof arg !== 'number') {
        throw interpreter.errorHandler.createRuntimeError(
            `${funcName}() expects a number as argument ${argPosition}. Got '${typeof arg}'.`,
            callNode,
            'TYPE001',
            `Ensure argument ${argPosition} for '${funcName}' is a number.`
        );
    }
}


// --- BuiltinFunction Definitions ---

// Case Conversion
const strToUpper = new BuiltinFunction("to_upper", (args, interpreter, callNode) => {
    expectString(args[0], "to_upper", interpreter, callNode, 1);
    return args[0].toUpperCase();
}, 1);

const strToLower = new BuiltinFunction("to_lower", (args, interpreter, callNode) => {
    expectString(args[0], "to_lower", interpreter, callNode, 1);
    return args[0].toLowerCase();
}, 1);

const strToTitleCase = new BuiltinFunction("to_title_case", (args, interpreter, callNode) => {
    expectString(args[0], "to_title_case", interpreter, callNode, 1);
    return args[0].toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}, 1);

const strCapitalize = new BuiltinFunction("capitalize", (args, interpreter, callNode) => {
    expectString(args[0], "capitalize", interpreter, callNode, 1);
    return args[0].charAt(0).toUpperCase() + args[0].slice(1);
}, 1);


// TODO: Consider 'to_title_case' or 'capitalize' later

// Trimming
const strTrim = new BuiltinFunction("trim", (args, interpreter, callNode) => {
    expectString(args[0], "trim", interpreter, callNode, 1);
    return args[0].trim();
}, 1);

const strTrimStart = new BuiltinFunction("trim_start", (args, interpreter, callNode) => { // or trim_left
    expectString(args[0], "trim_start", interpreter, callNode, 1);
    return args[0].trimStart();
}, 1);

const strTrimEnd = new BuiltinFunction("trim_end", (args, interpreter, callNode) => { // or trim_right
    expectString(args[0], "trim_end", interpreter, callNode, 1);
    return args[0].trimEnd();
}, 1);

// Padding
const strPadStart = new BuiltinFunction("pad_start", (args, interpreter, callNode) => {
    expectString(args[0], "pad_start", interpreter, callNode, 1);
    expectNumber(args[1], "pad_start", interpreter, callNode, 2);
    const padString = args.length > 2 ? args[2] : " ";
    expectString(padString, "pad_start", interpreter, callNode, 3);
    return args[0].padStart(args[1], padString);
}, [2, 3]); // string, targetLength, [padString]

const strPadEnd = new BuiltinFunction("pad_end", (args, interpreter, callNode) => {
    expectString(args[0], "pad_end", interpreter, callNode, 1);
    expectNumber(args[1], "pad_end", interpreter, callNode, 2);
    const padString = args.length > 2 ? args[2] : " ";
    expectString(padString, "pad_end", interpreter, callNode, 3);
    return args[0].padEnd(args[1], padString);
}, [2, 3]); // string, targetLength, [padString]

// Searching & Checking
const strContains = new BuiltinFunction("contains", (args, interpreter, callNode) => {
    expectString(args[0], "contains", interpreter, callNode, 1);
    expectString(args[1], "contains", interpreter, callNode, 2, false); // searchString shouldn't be empty typically for 'contains'
    const position = args.length > 2 ? args[2] : 0;
    expectNumber(position, "contains", interpreter, callNode, 3);
    return args[0].includes(args[1], position);
}, [2, 3]); // string, searchString, [position]

const strStartsWith = new BuiltinFunction("starts_with", (args, interpreter, callNode) => {
    expectString(args[0], "starts_with", interpreter, callNode, 1);
    expectString(args[1], "starts_with", interpreter, callNode, 2);
    const position = args.length > 2 ? args[2] : 0;
    expectNumber(position, "starts_with", interpreter, callNode, 3);
    return args[0].startsWith(args[1], position);
}, [2, 3]); // string, searchString, [position]

const strEndsWith = new BuiltinFunction("ends_with", (args, interpreter, callNode) => {
    expectString(args[0], "ends_with", interpreter, callNode, 1);
    expectString(args[1], "ends_with", interpreter, callNode, 2);
    const length = args.length > 2 ? args[2] : args[0].length;
    expectNumber(length, "ends_with", interpreter, callNode, 3);
    return args[0].endsWith(args[1], length);
}, [2, 3]); // string, searchString, [length]

const strIndexOf = new BuiltinFunction("index_of", (args, interpreter, callNode) => {
    expectString(args[0], "index_of", interpreter, callNode, 1);
    expectString(args[1], "index_of", interpreter, callNode, 2);
    const fromIndex = args.length > 2 ? args[2] : 0;
    expectNumber(fromIndex, "index_of", interpreter, callNode, 3);
    return args[0].indexOf(args[1], fromIndex);
}, [2, 3]); // string, searchValue, [fromIndex]

const strLastIndexOf = new BuiltinFunction("last_index_of", (args, interpreter, callNode) => {
    expectString(args[0], "last_index_of", interpreter, callNode, 1);
    expectString(args[1], "last_index_of", interpreter, callNode, 2);
    const fromIndex = args.length > 2 ? args[2] : args[0].length - 1;
    expectNumber(fromIndex, "last_index_of", interpreter, callNode, 3);
    return args[0].lastIndexOf(args[1], fromIndex);
}, [2, 3]); // string, searchValue, [fromIndex]


// Substring & Slicing
const strSubstring = new BuiltinFunction("substring", (args, interpreter, callNode) => { // Already have one like this
    expectString(args[0], "substring", interpreter, callNode, 1);
    expectNumber(args[1], "substring", interpreter, callNode, 2); // indexStart
    const indexEnd = args.length > 2 ? args[2] : undefined;
    if (indexEnd !== undefined) expectNumber(indexEnd, "substring", interpreter, callNode, 3);
    return args[0].substring(args[1], indexEnd);
}, [2, 3]);

const strSlice = new BuiltinFunction("slice", (args, interpreter, callNode) => {
    expectString(args[0], "slice", interpreter, callNode, 1);
    expectNumber(args[1], "slice", interpreter, callNode, 2); // beginIndex
    const endIndex = args.length > 2 ? args[2] : undefined;
    if (endIndex !== undefined) expectNumber(endIndex, "slice", interpreter, callNode, 3);
    return args[0].slice(args[1], endIndex);
}, [2, 3]);

// Splitting & Joining (join is already a global built-in for arrays)
const strSplit = new BuiltinFunction("split", (args, interpreter, callNode) => { // Already have one like this
    expectString(args[0], "split", interpreter, callNode, 1);
    const separator = args.length > 1 ? args[1] : undefined;
    const limit = args.length > 2 ? args[2] : undefined;
    if (separator !== undefined) expectStringOrNumber(separator, "split", interpreter, callNode, 2); // Separator can be regex too, but Mimo is simple
    if (limit !== undefined) expectNumber(limit, "split", interpreter, callNode, 3);
    return args[0].split(separator, limit);
}, [1, 3]); // string, [separator], [limit]

// Replacement
const strReplace = new BuiltinFunction("replace", (args, interpreter, callNode) => { // Already have one like this
    expectString(args[0], "replace", interpreter, callNode, 1);
    expectStringOrNumber(args[1], "replace", interpreter, callNode, 2); // pattern (can be string or regex in JS)
    expectString(args[2], "replace", interpreter, callNode, 3);       // replacement
    // For Mimo, keep it simple: pattern is a string. For regex, a dedicated regex module.
    if (typeof args[1] !== 'string') {
        throw interpreter.errorHandler.createRuntimeError(
            "replace() pattern (arg 2) must be a string for Mimo's string.replace.",
            callNode,
            'TYPE001',
            "Provide a string for the pattern to replace."
        );
    }
    return args[0].replace(args[1], args[2]);
}, 3);

const strReplaceAll = new BuiltinFunction("replace_all", (args, interpreter, callNode) => {
    expectString(args[0], "replace_all", interpreter, callNode, 1);
    expectStringOrNumber(args[1], "replace_all", interpreter, callNode, 2); // pattern
    expectString(args[2], "replace_all", interpreter, callNode, 3);       // replacement
    if (typeof args[1] !== 'string') {
        throw interpreter.errorHandler.createRuntimeError(
            "replace_all() pattern (arg 2) must be a string for Mimo's string.replace_all.",
            callNode,
            'TYPE001',
            "Provide a string for the pattern to replace."
        );
    }
    if (typeof String.prototype.replaceAll === 'function') { // Modern JS
        return args[0].replaceAll(args[1], args[2]);
    } else { // Fallback for older environments (simple string replacement)
        return args[0].split(args[1]).join(args[2]);
    }
}, 3);

// Other utilities
const strRepeat = new BuiltinFunction("repeat", (args, interpreter, callNode) => {
    expectString(args[0], "repeat", interpreter, callNode, 1);
    expectNumber(args[1], "repeat", interpreter, callNode, 2);
    return args[0].repeat(args[1]);
}, 2); // string, count

const strCharAt = new BuiltinFunction("char_at", (args, interpreter, callNode) => {
    expectString(args[0], "char_at", interpreter, callNode, 1);
    expectNumber(args[1], "char_at", interpreter, callNode, 2);
    return args[0].charAt(args[1]);
}, 2); // string, index

const strIsEmpty = new BuiltinFunction("is_empty", (args, interpreter, callNode) => {
    expectString(args[0], "is_empty", interpreter, callNode, 1);
    return args[0].length === 0;
}, 1);

const strIsBlank = new BuiltinFunction("is_blank", (args, interpreter, callNode) => {
    expectString(args[0], "is_blank", interpreter, callNode, 1);
    return args[0].trim().length === 0;
}, 1);

// `len` is already a global built-in.

// --- Export the module's contents ---
export const stringModuleExports = {
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
    is_empty: strIsEmpty,
    is_blank: strIsBlank,
    to_title_case: strToTitleCase,
    capitalize: strCapitalize,
};
