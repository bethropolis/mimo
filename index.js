/**
 * @file The Mimo library entry point for NODE.JS environments.
 * Exports the Mimo class and Node.js-specific helpers.
 */

import { Interpreter } from './interpreter/index.js';
import { Lexer } from './lexer/Lexer.js';
import { Parser } from './parser/Parser.js';
import { MimoError } from './interpreter/MimoError.js';
import { nodeAdapter } from './adapters/nodeAdapter.js';

export class Mimo {
    constructor(adapter = nodeAdapter) {
        this.interpreter = new Interpreter(adapter);
    }

    run(source, filePath) {
        if (!filePath) {
            throw new Error("Mimo.run() requires a filePath argument in a Node.js environment for module resolution.");
        }

        try {
            const lexer = new Lexer(source, filePath);
            const tokens = [];
            let token;
            while ((token = lexer.nextToken()) !== null) {
                tokens.push(token);
            }

            const parser = new Parser(tokens, filePath);
            this.interpreter.errorHandler.addSourceFile(filePath, source);
            parser.setErrorHandler(this.interpreter.errorHandler);
            const ast = parser.parse();

            const result = this.interpreter.interpret(ast, filePath);

            return result;

        } catch (error) {
            if (error instanceof MimoError) {
                throw error.format(this.interpreter.errorHandler.getLine(error.location.file, error.location.line));
            } else {
                throw error;
            }
        }
    }
}


// Export Node.js specific helpers and other components
export { Interpreter, Lexer, Parser, MimoError, nodeAdapter };