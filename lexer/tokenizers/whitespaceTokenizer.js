import { skipComments } from "./commentTokenizer.js";

export function isWhitespace(char) {
  return char === " " || char === "\t" || char === "\n" || char === "\r";
}

export function skipWhitespace(lexer) {
  while (!lexer.isAtEnd()) {
    const char = lexer.peek();
    
    if (char === " " || char === "\t") {
      lexer.advance();
    } else if (char === "\n") {
      lexer.advance();
    } else if (char === "/" && (lexer.peek(1) === "/" || lexer.peek(1) === "*")) {
      // Handle comments as part of whitespace skipping
      skipComments(lexer);
    } else {
      break;
    }
  }
}

export function skipSimpleWhitespace(lexer) {
  while (!lexer.isAtEnd()) {
    const char = lexer.peek();
    
    if (char === " " || char === "\t") {
      lexer.advance();
    } else if (char === "\n") {
      lexer.advance();
    } else {
      break;
    }
  }
}