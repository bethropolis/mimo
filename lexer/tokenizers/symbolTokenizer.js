import { TokenType } from "../TokenTypes.js";
import { createToken } from "../createToken.js";

export const SYMBOLS = {
  "(": TokenType.LParen,
  ")": TokenType.RParen,
  "[": TokenType.LBracket,
  "]": TokenType.RBracket,
  "{": TokenType.LBrace,
  "}": TokenType.RBrace,
  ",": TokenType.Comma,
  "?.": TokenType.Operator,
  ".": TokenType.Operator,
  "+": TokenType.Operator,
  "-": TokenType.Operator,
  "*": TokenType.Operator,
  "/": TokenType.Operator,
  "%": TokenType.Operator,
  ">": TokenType.Operator,
  "<": TokenType.Operator,
  "=": TokenType.Operator,
  "==": TokenType.Operator,
  "===": TokenType.Operator,
  "!": TokenType.Operator,
  "!=": TokenType.Operator,
  "!==": TokenType.Operator,
  ">=": TokenType.Operator,
  "<=": TokenType.Operator,
  "&&": TokenType.Operator,
  "||": TokenType.Operator,
  "->": TokenType.Operator, // Arrow operator
  "??": TokenType.Operator, // Null coalescing

  "...": TokenType.Spread, // Spread operator
  "..": TokenType.Range, // Range operator
  ":": TokenType.Colon,
};



export function readSymbol(lexer) {
  const startLine = lexer.line;
  const startColumn = lexer.column;
  const startPosition = lexer.position; // Capture original start position

  // Try to match longer symbols first (e.g., "==" before "=")
  const sortedSymbols = Object.keys(SYMBOLS).sort((a, b) => b.length - a.length);

  for (const symbolString of sortedSymbols) {
    if (lexer.source.startsWith(symbolString, lexer.position)) {
      // Found a match
      for (let i = 0; i < symbolString.length; i++) {
        lexer.advance(); // Consume the characters of the symbol
      }
      const tokenLength = symbolString.length;
      return lexer._createToken(SYMBOLS[symbolString], symbolString, startLine, startColumn, startPosition, tokenLength); // <--- Use lexer._createToken
    }
  }

  // If no recognized symbol prefix is found, it's an error
  const char = lexer.peek(); // Get the current character that caused the issue
  lexer.error( // <--- Use lexer.error
    `Unrecognized symbol or character: '${char}'.`,
    'LEX007',
    `The symbol or character '${char}' is not recognized. Check for typos or unsupported operators.`
  );
}