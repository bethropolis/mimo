// In: parser/expressions/operatorExpressions.js

import { TokenType, END_KEYWORDS } from "../../lexer/TokenTypes.js";
import { ASTNode } from "../ASTNodes.js";

let parseExpression;
let parsePrimaryExpression;

// This new Set contains all keywords that can ONLY start a new statement.
// If the parser sees one of these after an operand, it knows the expression is over.
const STATEMENT_START_KEYWORDS = new Set([
  'set', 'let', 'const', 'global', 'if', 'while', 'for', 'loop',
  'function', 'call', 'show', 'return', 'try', 'throw', 'match',
  'import', 'export', 'break', 'continue'
]);

export function setParseExpression(parseExpressionFn) {
  parseExpression = parseExpressionFn;
}

export function setParsePrimaryExpression(parsePrimaryExpressionFn) {
  parsePrimaryExpression = parsePrimaryExpressionFn;
}

export function parseBinaryOrUnary(parser) {
  const token = parser.peek();

  const isOperator = (token?.type === TokenType.Operator && !['.', '?.', '|>'].includes(token.value)) ||
    (token?.type === TokenType.Keyword && ['not', 'and', 'or'].includes(token.value));

  if (!isOperator) {
    return parsePrimaryExpression(parser);
  }

  const operatorToken = parser.consume();
  const operator = operatorToken.value;

  // The 'not' operator is always unary
  if (operator === 'not') {
    const argument = parseExpression(parser);
    return ASTNode.UnaryExpression(operator, argument, operatorToken);
  }

  const left = parseExpression(parser);

  // ==========================================================
  // THE DEFINITIVE FIX IS IN THE LOGIC BELOW
  // ==========================================================
  const nextToken = parser.peek();

  // An expression is considered "ended" if we are at the end of the file,
  // or the next token is a structural terminator, or it's a keyword that
  // *must* start a new statement.
  const isEndOfExpression = parser.isAtEnd() ||
    !nextToken ||
    nextToken.type === TokenType.RParen ||
    nextToken.type === TokenType.RBracket ||
    nextToken.type === TokenType.RBrace ||
    nextToken.type === TokenType.Comma ||
    nextToken.type === TokenType.Colon ||
    (nextToken.type === TokenType.Operator && nextToken.value === "->") ||
    (nextToken.type === TokenType.Keyword && (
      END_KEYWORDS.includes(nextToken.value) || // 'end', 'else', 'catch' etc.
      STATEMENT_START_KEYWORDS.has(nextToken.value) // 'show', 'set', 'if', etc.
    ));

  if (isEndOfExpression) {
    // There is no second operand, so it must be a unary expression.
    // Mimo currently only supports '-' as a unary numeric operator.
    if (operator !== '-') {
      parser.error(`Operator '${operator}' cannot be used as a unary operator.`, operatorToken, 'SYN039', `Did you mean to provide a second argument?`);
    }
    return ASTNode.UnaryExpression(operator, left, operatorToken);
  } else {
    // There's more to the expression, so we parse the second operand.
    const right = parseExpression(parser);
    return ASTNode.BinaryExpression(operator, left, right, operatorToken);
  }
}