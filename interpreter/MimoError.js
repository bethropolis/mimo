/**
 * Represents a Mimo language error.
 * Includes detailed information for better debugging and user experience.
 */
export class MimoError extends Error {
    /**
     * @param {string} type - 'LexerError', 'SyntaxError', 'RuntimeError'
     * @param {string} code - A unique error code (e.g., 'PARSE001', 'RUNTIME001', 'TYPE001')
     * @param {string} message - A concise description of the error.
     * @param {string} [suggestion=''] - An actionable suggestion for how to fix the error.
     * @param {Object} [location={}] - Object containing line, column, file, and a code snippet.
     * @param {Array<Object>} [stackFrames=[]] - An array of stack frames for runtime errors.
     */
    constructor(type, code, message, suggestion = '', location = {}, stackFrames = []) {
        super(message);
        this.name = type;
        this.type = type;
        this.code = code;
        this.suggestion = suggestion;

        // Ensure all location properties are explicitly defined, defaulting if not provided.
        this.location = {
            file: location.file || 'unknown',
            line: location.line,
            column: location.column,
            start: location.start, // <--- Add start
            length: location.length, // <--- Add length
            snippet: location.snippet, // <--- Add snippet
        };
        this.stackFrames = stackFrames;

        // Standard JavaScript error properties
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
            start: token.start,   // <--- Add start
            length: token.length, // <--- Add length
            file: token.file
        } : {};
        return new MimoError('LexerError', code, message, suggestion, location);
    }

    static syntaxError(code, message, astNodeOrToken, suggestion) {
        const location = astNodeOrToken ? {
            line: astNodeOrToken.line,
            column: astNodeOrToken.column,
            start: astNodeOrToken.start,   // <--- Add start
            length: astNodeOrToken.length, // <--- Add length
            file: astNodeOrToken.file
        } : {};
        return new MimoError('SyntaxError', code, message, suggestion, location);
    }

    static runtimeError(code, message, astNode, suggestion, stackFrames) {
        const location = astNode ? {
            line: astNode.line,
            column: astNode.column,
            start: astNode.start,   // <--- Add start
            length: astNode.length, // <--- Add length
            file: astNode.file,
        } : {};
        return new MimoError('RuntimeError', code, message, suggestion, location, stackFrames);
    }

    format(sourceCodeLine = '') {
        let output = `[${this.type} ${this.code}]: ${this.message}\n`;
        
        if (this.location.file) {
            output += `    at ${this.location.file}:${this.location.line}:${this.location.column}\n`;
        } else if (this.location.line !== undefined && this.location.column !== undefined) {
            output += `    at Line ${this.location.line}, Col ${this.location.column}\n`;
        }

        if (sourceCodeLine) {
            output += `> ${sourceCodeLine.trim()}\n`;
            if (this.location.column !== undefined && sourceCodeLine.trim().length > 0) {
                const trimmedOffset = sourceCodeLine.length - sourceCodeLine.trimStart().length;
                const pointerCol = Math.max(0, this.location.column - 1 - trimmedOffset);
                output += `  ${' '.repeat(pointerCol)}^\n`;
            }
        }

        if (this.suggestion) {
            output += `Suggestion: ${this.suggestion}\n`;
        }

        if (this.stackFrames && this.stackFrames.length > 0) {
            output += "Mimo Stack:\n";
            this.stackFrames.forEach(frame => {
                output += `    at ${frame.functionName} (${frame.file || 'unknown'}:${frame.line}:${frame.column})\n`;
            });
        }
        return output;
    }
}