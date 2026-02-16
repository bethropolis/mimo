export function createToken(type, value, line, column, start, length, file = 'unknown') {
    return {
        type,
        value,
        line,
        column,
        start,  // Starting character index in the source string
        length, // Number of characters this token spans in the source
        file,   // The file path
    };
}