import { MimoError } from './MimoError.js';

/**
 * Handles and formats errors within the Mimo interpreter.
 */
export class ErrorHandler {
    constructor(sourceCodeMap = {}) {
        this.sourceCodeMap = sourceCodeMap; // Map of filePath -> sourceCodeString
    }

    /**
     * Adds or updates source code for a given file path in the handler's map.
     * Useful for REPL or module loading where source becomes available dynamically.
     * @param {string} filePath
     * @param {string} sourceCode
     */
    addSourceFile(filePath, sourceCode) {
        this.sourceCodeMap[filePath] = sourceCode;
    }

    /**
     * Clears source code for a given file path from the handler's map.
     * Useful for cleaning up memory after a module is processed or a REPL line is done.
     * @param {string} filePath
     */
    clearSourceFile(filePath) {
        delete this.sourceCodeMap[filePath];
    }

    /**
     * Gets a specific line from the source code map for error reporting.
     * @param {string} filePath - The path to the source file.
     * @param {number} lineNumber - The 1-based line number.
     * @returns {string} The requested line of code, or an empty string if not found.
     */
    getLine(filePath, lineNumber) {
        const source = this.sourceCodeMap[filePath];
        if (!source) return '';
        const lines = source.split('\n');
        // line numbers are 1-based
        if (lineNumber > 0 && lineNumber <= lines.length) {
            return lines[lineNumber - 1];
        }
        return '';
    }

    /**
     * Creates and formats a LexerError.
     * @param {string} message - Error message.
     * @param {Object} token - The token that caused the error.
     * @param {string} [code='LEX000'] - Unique error code.
     * @param {string} [suggestion=''] - Actionable suggestion.
     * @returns {MimoError}
     */
    createLexerError(message, token, code = 'LEX000', suggestion = '') {
        const error = MimoError.lexerError(code, message, token, suggestion);
        error.location.file = token.file || 'unknown'; // Ensure file is set from token
        error.location.snippet = this.getLine(error.location.file, error.location.line);
        return error;
    }

    /**
     * Creates and formats a SyntaxError.
     * @param {string} message - Error message.
     * @param {Object} astNodeOrToken - The AST node or token that caused the error.
     * @param {string} [code='SYN000'] - Unique error code.
     * @param {string} [suggestion=''] - Actionable suggestion.
     * @returns {MimoError}
     */
    createSyntaxError(message, astNodeOrToken, code = 'SYN000', suggestion = '') {
        const error = MimoError.syntaxError(code, message, astNodeOrToken, suggestion);
        error.location.file = astNodeOrToken.file || 'unknown'; // Ensure file is set
        error.location.snippet = this.getLine(error.location.file, error.location.line);
        return error;
    }

    /**
     * Creates and formats a RuntimeError.
     * @param {string} message - Error message.
     * @param {Object} astNode - The AST node being evaluated when the error occurred.
     * @param {string} [code='RUN000'] - Unique error code.
     * @param {string} [suggestion=''] - Actionable suggestion.
     * @param {Array<Object>} [stackFrames=[]] - The Mimo call stack (from interpreter).
     * @returns {MimoError}
     */
    createRuntimeError(message, astNode, code = 'RUN000', suggestion = '', stackFrames = []) {

        const error = MimoError.runtimeError(code, message, astNode, suggestion, stackFrames);
        // Ensure file is set for runtime errors too, even if astNode has it.
        // It's crucial for context.
        error.location.file = astNode?.file || 'unknown';
        error.location.snippet = this.getLine(error.location.file, error.location.line);
        return error;
    }

    /**
     * Prints an error to the console.
     * @param {Error|MimoError} error - The error object.
     */
    printError(error) {
        if (error instanceof MimoError) {
            console.error(error.format(error.location.snippet));
        } else {
            // Fallback for unexpected non-Mimo errors
            console.error(`An unexpected error occurred: ${error.message}`);
            console.error(error.stack);
        }
    }
}
