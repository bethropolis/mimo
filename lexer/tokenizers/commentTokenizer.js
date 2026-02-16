export function isCommentStart(lexer) {
  const char = lexer.peek();
  return char === "/" && (lexer.peek(1) === "/" || lexer.peek(1) === "*");
}

export function skipSingleLineComment(lexer) {
  // Skip the '//' characters
  lexer.advance();
  lexer.advance();

  // Skip until end of line or end of file
  while (!lexer.isAtEnd() && lexer.peek() !== "\n") {
    lexer.advance();
  }
}

export function skipMultiLineComment(lexer) {
  // Skip the '/*' characters
  lexer.advance();
  lexer.advance();

  // Skip until we find '*/' or reach end of file
  while (!lexer.isAtEnd()) {
    if (lexer.peek() === "*" && lexer.peek(1) === "/") {
      // Found end of comment, skip the '*/' characters
      lexer.advance();
      lexer.advance();
      break;
    }
    lexer.advance();
  }
}

export function skipComments(lexer) {
  while (!lexer.isAtEnd()) {
    const char = lexer.peek();
    if (char === "/" && lexer.peek(1) === "/") {
      skipSingleLineComment(lexer);
    } else if (char === "/" && lexer.peek(1) === "*") {
      skipMultiLineComment(lexer);
    } else {
      break;
    }
  }
}