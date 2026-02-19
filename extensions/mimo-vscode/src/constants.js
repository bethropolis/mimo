const KEYWORDS = [
    { name: "set", doc: "Declare or update a mutable variable" },
    { name: "let", doc: "Declare a block-scoped variable" },
    { name: "const", doc: "Declare an immutable constant" },
    { name: "global", doc: "Declare a global variable" },
    { name: "if", doc: "Conditional statement" },
    { name: "elif", doc: "Else-if clause in conditional" },
    { name: "else", doc: "Else clause in conditional" },
    { name: "while", doc: "While loop" },
    { name: "for", doc: "For-in loop" },
    { name: "in", doc: "Keyword for iteration" },
    { name: "match", doc: "Pattern matching expression" },
    { name: "case", doc: "Case clause in match" },
    { name: "default", doc: "Default clause in match" },
    { name: "break", doc: "Exit from loop" },
    { name: "continue", doc: "Skip to next iteration" },
    { name: "function", doc: "Define a function" },
    { name: "call", doc: "Call a function" },
    { name: "return", doc: "Return from function" },
    { name: "try", doc: "Try block for error handling" },
    { name: "catch", doc: "Catch block for error handling" },
    { name: "throw", doc: "Throw an error" },
    { name: "import", doc: "Import a module" },
    { name: "export", doc: "Export from module" },
    { name: "from", doc: "Module source keyword" },
    { name: "as", doc: "Alias keyword" },
    { name: "show", doc: "Print a value to output" },
    { name: "end", doc: "End a block" },
];

const BUILTINS = [
    { name: "len", doc: "Get length of string or array" },
    { name: "get", doc: "Get element from array or property from object" },
    { name: "update", doc: "Update element in array or property in object" },
    { name: "type", doc: "Get type of a value" },
    { name: "push", doc: "Add element to end of array" },
    { name: "pop", doc: "Remove and return last element of array" },
    { name: "slice", doc: "Extract portion of array" },
    { name: "range", doc: "Create array of numbers in range" },
    { name: "join", doc: "Join array elements into string" },
    { name: "has_property", doc: "Check if object has property" },
    { name: "keys", doc: "Get keys of object" },
    { name: "values", doc: "Get values of object" },
    { name: "entries", doc: "Get key-value pairs of object" },
    { name: "get_arguments", doc: "Get command line arguments" },
    { name: "get_env", doc: "Get environment variable" },
    { name: "exit_code", doc: "Set exit code" },
    { name: "coalesce", doc: "Return first non-null value" },
    { name: "get_property_safe", doc: "Safely get property (null-safe)" },
    { name: "if_else", doc: "Ternary-like function" },
];

const MODULES = [
    { name: "array", doc: "Array manipulation functions (map, filter, reduce, etc.)" },
    { name: "string", doc: "String manipulation functions (to_upper, trim, split, etc.)" },
    { name: "math", doc: "Math functions (sqrt, pow, sin, cos, random, etc.)" },
    { name: "json", doc: "JSON parse and stringify" },
    { name: "fs", doc: "File system operations (read, write, exists, etc.)" },
    { name: "http", doc: "HTTP requests (get, post)" },
    { name: "datetime", doc: "Date and time operations" },
    { name: "regex", doc: "Regular expression operations" },
];

const ARRAY_METHODS = [
    "map", "filter", "reduce", "for_each", "find", "find_index",
    "includes", "index_of", "last_index_of", "slice", "first", "last",
    "is_empty", "sort", "reverse", "shuffle", "concat", "unique",
    "intersection", "union", "difference"
];

const STRING_METHODS = [
    "length", "to_upper", "to_lower", "to_title_case", "capitalize", "trim",
    "substring", "slice", "contains", "starts_with", "ends_with", "index_of",
    "replace", "split", "join"
];

const MATH_CONSTANTS = ["PI", "E"];
const MATH_METHODS = ["abs", "sqrt", "pow", "floor", "ceil", "round", "sin", "cos", "tan", "random", "seed", "randint"];

module.exports = {
    KEYWORDS,
    BUILTINS,
    MODULES,
    ARRAY_METHODS,
    STRING_METHODS,
    MATH_CONSTANTS,
    MATH_METHODS
};
