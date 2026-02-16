// parser.js
import { TokenType } from "./../lexer/TokenTypes.js";
import { setupExpressionParsers } from "./parserExpressions.js";
import { MimoError } from "../interpreter/MimoError.js";
import { parseStatement } from "./parseStatement.js";
import { ASTNode } from "./ASTNodes.js";

export class Parser {
  constructor(tokens, filePath = "unknown") {
    this.tokens = tokens;
    this.current = 0;
    this.filePath = filePath; // Store filePath
    this.errorHandler = null; // To be set by Interpreter or CLI for source context
  }

  // Method to set the error handler (which contains source code context)
  setErrorHandler(errorHandler) {
    this.errorHandler = errorHandler;
  }

  error(message, token = this.peek(), code = "SYN000", suggestion = "") {
    let errorToken = token;
    // If no valid token is provided or peek() returned undefined,
    // try to use the token that was *just consumed* or a dummy EOF token.
    if (
      !errorToken ||
      errorToken.type === undefined ||
      errorToken.line === undefined
    ) {
      // Fallback to the last consumed token, or end-of-file dummy token
      errorToken = this.tokens[this.current - 1] || {
        // Last successfully consumed token
        type: "EOF",
        value: "",
        line: 1,
        column: 1,
        start: 0,
        length: 0,
        file: this.filePath,
      }; // Fallback
    }
    // Ensure the errorToken has the `file` property for the ErrorHandler
    errorToken.file = errorToken.file || this.filePath;

    // Use the ErrorHandler instance to create the MimoError
    if (this.errorHandler) {
      throw this.errorHandler.createSyntaxError(
        message,
        errorToken,
        code,
        suggestion
      );
    } else {
      // Fallback: create a basic MimoError if no errorHandler is set
      throw new MimoError("SyntaxError", code, message, suggestion, {
        line: errorToken.line,
        column: errorToken.column,
        file: errorToken.file,
      });
    }
  }

  expect(type, value, code = "SYN000", suggestion = "Syntax error.") {
    const token = this.peek();
    if (token.type === type && (value === undefined || token.value === value)) {
      return this.consume();
    }
    const displayValue = value ? `'${value}' (${type})` : type;
    const displayGot = token.value
      ? `'${token.value}' (${token.type})`
      : token.type;
    this.error(
      `Expected ${displayValue} but got ${displayGot}.`,
      token,
      code,
      suggestion
    );
  }

  expectKeyword(keyword, code = "SYN000", suggestion = "Syntax error.") {
    const token = this.peek();
    if (token.type === TokenType.Keyword) {
      // Handle both single keyword and array of keywords
      if (Array.isArray(keyword)) {
        if (keyword.includes(token.value)) {
          return this.consume();
        }
        // If none of the keywords match, create error with all expected keywords
        const expectedKeywords = keyword.map((k) => `'${k}'`).join(", ");
        this.error(
          `Expected one of ${expectedKeywords} but got '${token.value}' (${token.type}).`,
          token,
          code,
          suggestion
        );
      } else {
        // Single keyword case
        if (token.value === keyword) {
          return this.consume();
        }
        this.error(
          `Expected '${keyword}' (keyword) but got '${token.value}' (${token.type}).`,
          token,
          code,
          suggestion
        );
      }
    }
    this.error(
      `Expected keyword but got '${token.value}' (${token.type}).`,
      token,
      code,
      suggestion
    );
  }

  match(type, value) {
    const token = this.peek();
    if (token && token.type === type && (!value || token.value === value)) {
      this.consume();
      return true;
    }
    return false;
  }

  matchKeyword(keyword) {
    return this.match(TokenType.Keyword, keyword);
  }

  isAtEnd() {
    return this.current >= this.tokens.length;
  }

  peek(index = 0) {
    return this.tokens[this.current + index];
  }

  consume() {
    const token = this.tokens[this.current];
    this.current++;
    return token;
  }

  // New: parseIdentifier method
  parseIdentifier(code = "SYN000", suggestion = "Expected an identifier.") {
    const token = this.peek();
    if (token.type === TokenType.Identifier) {
      this.consume();
      return ASTNode.Identifier(token.value, token); // Pass full token for location
    }
    this.error(
      `Expected an identifier but got ${token.type} '${token.value}'.`,
      token,
      code,
      suggestion
    );
  }

  parse() {
    setupExpressionParsers();

    const statements = [];
    const programStartToken = this.tokens[0] || {
      type: "ProgramStart",
      value: "",
      line: 1,
      column: 1,
      start: 0,
      length: 0,
      file: this.filePath,
    };

    while (!this.isAtEnd()) {
      // This is important: skip newlines/semicolons between statements
      // if your grammar allows them freely and they're not handled by indentation.
      // For Mimo, typically, whitespace including newlines is skipped by lexer.
      // So, this loop is often not needed here. But if your parser explicitly expects them, keep.
      // For simplicity and matching current grammar assumptions, let's keep it minimal.
      // If your lexer provides TokenType.Newline:
      // while (this.match(TokenType.Newline));

      if (this.isAtEnd()) break;

      statements.push(parseStatement(this)); // <--- Call the imported function and pass 'this'
    }
    return ASTNode.Program(statements, programStartToken);
  }
}
