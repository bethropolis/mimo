import { KEYWORDS, TokenType } from "../TokenTypes.js";
import { createToken } from "../createToken.js";

export function isLiteralStart(char) {
  return isAlpha(char) || isDigit(char) || char === '"';
}

export function readIdentifier(lexer) {
  const startLine = lexer.line;
  const startColumn = lexer.column;
  const startPosition = lexer.position; // Capture original start position
  let value = "";

  while (!lexer.isAtEnd() && isAlphaNumeric(lexer.peek())) {
    value += lexer.peek();
    lexer.advance();
  }

  const length = value.length; // Calculate length

  // Handle boolean and null literals first, as they have specific TokenTypes
  if (value === "true") {
    return lexer._createToken(TokenType.Boolean, true, startLine, startColumn, startPosition, length);
  }
  if (value === "false") {
    return lexer._createToken(TokenType.Boolean, false, startLine, startColumn, startPosition, length);
  }
  if (value === "null") {
    return lexer._createToken(TokenType.Null, null, startLine, startColumn, startPosition, length);
  }

  // Check if the identifier is a keyword (using includes for arrays)
  if (KEYWORDS.includes(value)) { // <--- FIXED: Use .includes() for array check
    return lexer._createToken(TokenType.Keyword, value, startLine, startColumn, startPosition, length);
  }

  // Otherwise, it's a regular identifier
  return lexer._createToken(TokenType.Identifier, value, startLine, startColumn, startPosition, length);
}

export function readNumber(lexer) {
  const startLine = lexer.line;
  const startCol = lexer.column; // Corrected to startColumn for consistency, though guide uses startCol
  const startPosition = lexer.position; // Capture original start position
  let value = "";
  let hasDecimal = false;
  let hasExponent = false;

  while (!lexer.isAtEnd()) {
    const char = lexer.peek();
    if (isDigit(char)) {
      value += char;
    } else if (char === "." && !hasDecimal && !hasExponent && isDigit(lexer.peek(1))) {
      value += char;
      hasDecimal = true;
    } else if ((char === "e" || char === "E") && !hasExponent) {
      // Check if the next char is a sign or a digit for a valid exponent
      const nextChar = lexer.peek(1);
      if (nextChar === '+' || nextChar === '-' || isDigit(nextChar)) {
        value += char; // Add 'e' or 'E'
        lexer.advance(); // Consume 'e' or 'E'
        if (nextChar === '+' || nextChar === '-') {
            value += nextChar; // Add sign
            lexer.advance(); // Consume sign
        }
        // Now read the exponent digits
        while(!lexer.isAtEnd() && isDigit(lexer.peek())){
            value += lexer.peek();
            lexer.advance();
        }
        hasExponent = true;
        // Since we manually advanced for exponent parts, we break here
        // The main loop's advance() would skip characters otherwise.
        break; 
      } else {
        // Not a valid exponent (e.g., "123e" followed by non-digit/non-sign)
        break;
      }
    } else {
      break;
    }
    lexer.advance();
  }
  // The guide.md snippet for readNumber is incomplete, so I'm using the logic from the `readIdentifier` and the `before` part of `readNumber`
  // to ensure startPosition and length are correctly passed.
  return lexer._createToken(TokenType.Number, parseFloat(value), startLine, startCol, startPosition, value.length);
}

export function readString(lexer) {
  const startLine = lexer.line;
  const startCol = lexer.column;
  const startPos = lexer.position;
  const quote = lexer.peek(); // Get the opening quote character
  lexer.advance(); // Consume opening quote

  let value = "";

  while (!lexer.isAtEnd()) {
    const char = lexer.peek();

    if (char === quote) {
      // End of string found
      lexer.advance(); // Consume closing quote
      const tokenLength = lexer.position - startPos;
      return lexer._createToken(TokenType.String, value, startLine, startCol, startPos, tokenLength);
    }

    if (char === '\n') {
      // Unterminated string error
      lexer.error(
        "Unterminated string literal. Newline encountered.",
        'LEX004',
        "String literals must be closed on the same line or use '\\n' for a newline character."
      );
    }

    // --- CRITICAL FIX FOR ESCAPE CHARACTERS ---
    if (char === '\\') {
      lexer.advance(); // Consume the backslash

      if (lexer.isAtEnd()) {
        lexer.error("Unterminated escape sequence at end of file.", 'LEX005');
      }

      const escapedChar = lexer.peek();
      switch (escapedChar) {
        case 'n': value += '\n'; break;
        case 't': value += '\t'; break;
        case 'r': value += '\r'; break;
        case '\\': value += '\\'; break;
        case '"': value += '"'; break; // This handles \"
        // You can add support for other quotes like \' if needed
        default:
          lexer.error(`Invalid escape sequence: \\${escapedChar}`, 'LEX003');
      }
    } else {
      // Regular character
      value += char;
    }

    lexer.advance(); // Move to the next character in the source
  }

  // If the loop finishes, it means we hit the end of the file without a closing quote.
  lexer.error(
    "Unterminated string literal.",
    'LEX005',
    `A string starting with ${quote} was not properly closed.`
  );
}

// Helper functions
export function isAlpha(char) {
  return /^[a-zA-Z_]$/.test(char);
}

export function isAlphaNumeric(char) {
  return /^[a-zA-Z0-9_]$/.test(char);
}

export function isDigit(char) {
  return /^[0-9]$/.test(char);
}