import { TokenType } from "../../lexer/TokenTypes.js";
import { ASTNode } from "../ASTNodes.js";
import { parseExpression } from "../parserExpressions.js";
import { parseBlock, isBlockEnd } from "../parserUtils.js";

export function parseIfStatement(parser) {
  const ifToken = parser.expectKeyword("if", 'SYN046', 'Expected "if" keyword to start an if statement.');
  const condition = parseExpression(parser);
  // parser.expect(TokenType.Keyword, "then", 'SYNXXX', 'Expected "then" keyword after if condition.'); // If your language uses "then"
  const consequent = parseBlock(parser, ["else", "end"]);

  let alternate = null;
  if (parser.matchKeyword("else")) {
    if (parser.peek()?.value === "if" && parser.peek()?.type === TokenType.Keyword) {
      alternate = parseIfStatement(parser); // Handles "else if"
    } else {
      alternate = parseBlock(parser, ["end"]);
    }
  }

  parser.expectKeyword("end", 'SYN047', 'Expected "end" keyword to close if statement.');
  return ASTNode.IfStatement(condition, consequent, alternate, ifToken);
}

export function parseGuardStatement(parser) {
  const guardToken = parser.expectKeyword("guard", "SYN120", 'Expected "guard" keyword to start an guard statement.');
  const condition = parseExpression(parser);
  parser.expectKeyword("else", "SYN121", 'Expected "else" keyword after guard condition.');
  const alternate = parseBlock(parser, ["end"]);
  parser.expectKeyword("end", "SYN122", 'Expected "end" keyword to close guard statement.');
  return ASTNode.GuardStatement(condition, alternate, guardToken);
}

export function parseWhileStatement(parser) {
  const whileToken = parser.expect(TokenType.Keyword);
  const condition = parseExpression(parser);
  const body = parseBlock(parser);

  parser.expect(TokenType.Keyword, "end");
  return ASTNode.WhileStatement(condition, body, whileToken);
}

export function parseForStatement(parser) {
  const forToken = parser.expectKeyword("for", 'SYN048', 'Expected "for" keyword to start a for loop.');
  const loopVar = parser.parseIdentifier('SYN048A', 'Expected an identifier for the loop variable.');

  parser.expectKeyword("in", 'SYN049', 'Expected "in" keyword in for loop (e.g., for item in iterable).');

  const iterable = parseExpression(parser);

  const body = parseBlock(parser, ["end"]);
  parser.expectKeyword("end", 'SYN050', 'Expected "end" keyword to close for loop.');

  return ASTNode.ForStatement(loopVar, iterable, body, forToken);
}

export function parseLoopStatement(parser) {
  const loopToken = parser.expect(TokenType.Keyword);
  const body = parseBlock(parser);
  parser.expect(TokenType.Keyword, "end");

  return ASTNode.LoopStatement(body, null, loopToken);
}

export function parseBreakStatement(parser) {
  const breakToken = parser.expect(TokenType.Keyword);

  // Check for optional label
  let label = null;
  if (parser.peek()?.type === TokenType.Identifier) {
    label = parser.expect(TokenType.Identifier).value;
  }

  return ASTNode.BreakStatement(label, breakToken);
}

export function parseContinueStatement(parser) {
  const continueToken = parser.expect(TokenType.Keyword);

  // Check for optional label
  let label = null;
  if (parser.peek()?.type === TokenType.Identifier) {
    label = parser.expect(TokenType.Identifier).value;
  }

  return ASTNode.ContinueStatement(label, continueToken);
}

export function parseTryStatement(parser) {
  const tryToken = parser.expectKeyword("try", 'SYN051', 'Expected "try" keyword to start a try-catch block.');
  const tryBlock = parseBlock(parser, ["catch", "end"]);

  let catchVar = null;
  let catchBlock = []; // Initialize as empty array
  if (parser.matchKeyword("catch")) {
    // Optional: allow specifying a variable for the caught error
    if (parser.peek()?.type === TokenType.Identifier) {
      catchVar = parser.parseIdentifier('SYN051A', 'Expected an identifier for the catch variable.');
    }
    catchBlock = parseBlock(parser, ["end"]);
  }

  parser.expectKeyword("end", 'SYN052', 'Expected "end" keyword to close try-catch block.');
  return ASTNode.TryStatement(tryBlock, catchVar, catchBlock, tryToken);
}

