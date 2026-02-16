import { END_KEYWORDS, TokenType } from "../lexer/TokenTypes.js";
import { parseStatement } from "./parseStatement.js";

export function parseBlock(parser, customEndKeywords = []) {
  const endKeywords = new Set([...END_KEYWORDS, ...customEndKeywords]);
  const statements = [];

  while (!parser.isAtEnd() && !isBlockEnd(parser, endKeywords)) {

    statements.push(parseStatement(parser));
  }

  return statements;
}

export function isBlockEnd(parser, endKeywords) {
  const token = parser.peek();
  return token.type === TokenType.Keyword && endKeywords.has(token.value);
}