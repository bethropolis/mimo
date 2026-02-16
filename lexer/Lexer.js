import { TokenType } from "./TokenTypes.js";
import { createToken as _createTokenRaw } from "./createToken.js"; // <--- Add this import
import { skipWhitespace } from "./tokenizers/whitespaceTokenizer.js";
import {
  isLiteralStart,
  readIdentifier,
  readNumber,
  readString,
  isAlpha,
  isDigit,
} from "./tokenizers/literalTokenizer.js";
import { readSymbol } from "./tokenizers/symbolTokenizer.js";
import { MimoError } from "../interpreter/MimoError.js";

export class Lexer {
  constructor(source, filePath = "unknown") {
    // Add filePath
    this.source = source;
    this.filePath = filePath; // Store filePath
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.previousToken = null;

    // State for template literals
    // 0: Normal
    // 1: Inside template, expecting StringFragment or ${ or `
    // 2: Inside template, just saw ${, expecting expression (normal tokenizing)
    // 3: Inside template, just saw }, expecting StringFragment or ${ or `
    this.templateLiteralState = 0;
    this.templateLiteralDepth = 0; // To handle nested templates if ever supported
  }

  isAtEnd() {
    return this.position >= this.source.length;
  }

  peek(offset = 0) {
    return this.position + offset < this.source.length
      ? this.source[this.position + offset]
      : null;
  }

  advance() {
    if (!this.isAtEnd()) {
      const char = this.source[this.position];
      if (char === "\n") {
        // <--- FIXED: Now checks for actual newline character
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.position++;
    }
  }

  // Internal helper for Lexer's own token creation (e.g., for template literals)
  // and for external tokenizers to use.
  _createToken(type, value, startLine, startColumn, startPosition, length) {
    // Calls the raw createToken from lexer/createToken.js
    return _createTokenRaw(
      type,
      value,
      startLine,
      startColumn,
      startPosition,
      length,
      this.filePath
    );
  }

  // Helper for consistent error reporting (as discussed before)
  error(message, code = "LEX000", suggestion = "") {
    const errorToken = {
      // Create a token-like object for error location
      value:
        this.peek() ||
        this.source.substring(this.position - 1, this.position) ||
        "",
      line: this.line,
      column: this.column,
      start: this.position, // Point to the current position
      length: 1,
      file: this.filePath,
    };
    // CORRECTED: Pass arguments in the order expected by MimoError.lexerError(code, message, token, suggestion)
    throw MimoError.lexerError(code, message, errorToken, suggestion);
  }

  nextToken() {
    const startLine = this.line;
    const startColumn = this.column;
    const startPosition = this.position; // Capture start position for the token

    skipWhitespace(this);

    if (this.isAtEnd()) return null;

    const char = this.peek(); // char needs to be defined here to be used later

    // Handle template literal states (State 1 or 3)
    if (this.templateLiteralState === 1 || this.templateLiteralState === 3) {
      if (this.peek() === "`") {
        this.advance();
        this.templateLiteralState = 0;
        this.templateLiteralDepth--;
        return this._createToken(
          TokenType.Backtick,
          "`",
          startLine,
          startColumn,
          startPosition,
          1
        );
      }

      if (this.peek() === "$" && this.peek(1) === "{") {
        this.advance();
        this.advance();
        this.templateLiteralState = 2;
        return this._createToken(
          TokenType.InterpolationStart,
          "${",
          startLine,
          startColumn,
          startPosition,
          2
        );
      }

      let fragment = "";
      // Loop to read string fragment, handling escapes
      while (
        !this.isAtEnd() &&
        this.peek() !== "`" &&
        !(this.peek() === "$" && this.peek(1) === "{")
      ) {
        const currentFragmentChar = this.peek(); // Renamed to avoid conflict with outer 'char'
        if (currentFragmentChar === "\\") {
          // <--- Correctly checking for backslash
          this.advance(); // consume backslash
          if (this.isAtEnd()) {
            this.error(
              "Unterminated escape sequence in template fragment.",
              "LEX004",
              "Complete the escape sequence or close the template literal."
            );
          }
          const escapedChar = this.peek();
          switch (escapedChar) {
            case "n":
              fragment += "\n";
              break; // <--- FIXED: store actual newline
            case "t":
              fragment += "\t";
              break; // <--- FIXED: store actual tab
            case "r":
              fragment += "\r";
              break; // <--- FIXED: store actual carriage return
            case "\\":
              fragment += "\\";
              break; // <--- FIXED: store actual backslash
            case "`":
              fragment += "`";
              break;
            case "$":
              fragment += "$";
              break;
            case "{":
              fragment += "{";
              break;
            default:
              this.error(
                `Unrecognized escape sequence in template: '\\${escapedChar}'.`,
                "LEX005",
                "Use valid escape sequences like '\\n', '\\t', '\\\\', '\\`', '\\$'."
              );
          }
          this.advance(); // consume escaped character
        } else if (currentFragmentChar === "\n") {
          // <--- Handle literal newlines inside template fragments
          fragment += currentFragmentChar;
          this.advance();
        } else {
          fragment += currentFragmentChar;
          this.advance();
        }
      }
      if (fragment.length > 0) {
        // Calculate length of the *original* source consumed for this fragment
        return this._createToken(
          TokenType.StringFragment,
          fragment,
          startLine,
          startColumn,
          startPosition,
          this.position - startPosition
        );
      }
    }

    // Handle template literal start (` `)
    if (char === "`") {
      this.advance();
      this.templateLiteralState = 1;
      this.templateLiteralDepth++;
      return this._createToken(
        TokenType.Backtick,
        "`",
        startLine,
        startColumn,
        startPosition,
        1
      );
    }
    // Handle template interpolation end (})
    if (this.templateLiteralState === 2 && char === "}") {
      this.advance();
      this.templateLiteralState = 3;
      return this._createToken(
        TokenType.InterpolationEnd,
        "}",
        startLine,
        startColumn,
        startPosition,
        1
      );
    }

    // Normal tokenizing mode
    let token;
    if (isAlpha(char)) {
      token = readIdentifier(this);
    } else if (isDigit(char)) {
      token = readNumber(this);
    } else if (char === '"') {
      // Assuming only double quotes for strings based on current `readString`
      token = readString(this);
    } else {
      token = readSymbol(this);
    }
    return token; // Tokenizers should return the token
  }
}
