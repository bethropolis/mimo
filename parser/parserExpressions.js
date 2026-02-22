import { TokenType } from "./../lexer/TokenTypes.js";
import { ASTNode } from "./ASTNodes.js";
import { parseBlock } from "./parserUtils.js";

// Import atomic expression parsing functions and their setter
import {
  parseAtomicExpression,
  parseArrayLiteral,
  parseObjectLiteral,
  setParseExpression as setAtomicParseExpression // Alias for atomicExpressions.js's setter
} from "./expressions/atomicExpressions.js";

// Import primary expression parsing function and its setter
import {
  parsePrimaryExpression,
  setParseExpression as setPrimaryExpressionParseExpression // Alias for primaryExpressions.js's setter
} from "./expressions/primaryExpressions.js";


// Import operator expression parsing functions and their setters
import {
  parseBinaryOrUnary,
  setParseExpression as setOperatorExpressionParseExpression, // Alias for operatorExpressions.js's main setter
  setParsePrimaryExpression as setOperatorPrimaryExpressionParsePrimary // Alias for operatorExpressions.js's primary setter
} from "./expressions/operatorExpressions.js";


/**
 * Parses a callee expression for |>: either an identifier, module.prop access,
 * or an inline-if expression. Optionally consumes extra arguments in parentheses.
 * Returns { callee, args }.
 */
function parsePipeCallee(parser) {
  // Support inline-if as callee: value |> if cond then fn1 else fn2
  if (parser.peek()?.type === TokenType.Keyword && parser.peek()?.value === "if") {
    const ifToken = parser.consume();
    const condition = parseExpression(parser);
    parser.expectKeyword("then", "SYN130", "Expected 'then' after condition in pipe inline-if.");
    const consequent = parseExpression(parser);
    parser.expectKeyword("else", "SYN131", "Expected 'else' in pipe inline-if.");
    const alternate = parseExpression(parser);
    const callee = ASTNode.InlineIfExpression(condition, consequent, alternate, ifToken);
    // No extra args supported for inline-if callee (the fn itself receives the piped value)
    return { callee, args: [] };
  }

  // Parse callee: identifier or module.prop
  const firstToken = parser.expect(TokenType.Identifier, undefined, "SYN132", "Expected a function name after '|>'.");
  let callee;
  if (parser.peek()?.type === TokenType.Operator && parser.peek()?.value === ".") {
    parser.consume(); // consume '.'
    const prop = parser.expect(TokenType.Identifier, undefined, "SYN133", "Expected property name after '.' in pipe callee.");
    callee = ASTNode.ModuleAccess(firstToken.value, prop.value, firstToken);
  } else {
    callee = ASTNode.Identifier(firstToken.value, firstToken);
  }

  // Parse optional extra arguments: value |> func(arg2, arg3)
  const args = [];
  if (parser.peek()?.type === TokenType.LParen) {
    parser.consume(); // consume '('
    if (parser.peek()?.type !== TokenType.RParen) {
      do {
        if (parser.peek()?.type === TokenType.Spread) {
          const spreadToken = parser.consume();
          const argument = parseExpression(parser);
          args.push(ASTNode.SpreadElement(argument, spreadToken));
        } else {
          args.push(parseExpression(parser));
        }
      } while (parser.match(TokenType.Comma));
    }
    parser.expect(TokenType.RParen, undefined, "SYN134", "Expected ')' after pipe arguments.");
  }

  return { callee, args };
}

// Main entry point for parsing an expression
function parseExpression(parser) {
  // Parse the left-hand side (standard Mimo prefix expression)
  let left = parseBinaryOrUnary(parser);

  // Then handle any pipe operators (left-associative)
  while (parser.peek()?.type === TokenType.Operator && parser.peek()?.value === "|>") {
    const pipeToken = parser.consume(); // consume '|>'
    const { callee, args } = parsePipeCallee(parser);
    left = ASTNode.PipeExpression(left, callee, args, pipeToken);
  }

  return left;
}

/**
 * Sets up the forward references for mutually recursive expression parsing functions.
 * This function MUST be called once, before any expression parsing begins.
 */
export function setupExpressionParsers() {
  // Pass the top-level parseExpression function to any sub-parsers that need to call it.
  setAtomicParseExpression(parseExpression); // For atomicExpressions.js (e.g., for nested expressions in literals)
  setPrimaryExpressionParseExpression(parseExpression); // For primaryExpressions.js (e.g., for `arr[index]`
  setOperatorExpressionParseExpression(parseExpression); // For operatorExpressions.js (e.g., for `+ left right`)

  // Pass parsePrimaryExpression to operatorExpressions.js (for `parseBinaryOrUnary` default case)
  setOperatorPrimaryExpressionParsePrimary(parsePrimaryExpression);


}

// Export the main parsing functions that other parts of the parser might need to call.
export {
  parseExpression,
  parsePrimaryExpression,
  parseBinaryOrUnary,
};
