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


// Main entry point for parsing an expression
function parseExpression(parser) {
  // As per previous decision, currently bypassing conditional expression and going directly to binary/unary.
  // If you re-enable ternary later, you'd change this back to `return parseConditionalExpression(parser);`
  return parseBinaryOrUnary(parser);
}

/**
 * Sets up the forward references for mutually recursive expression parsing functions.
 * This function MUST be called once, before any expression parsing begins.
 */
export function setupExpressionParsers() {
  // Pass the top-level parseExpression function to any sub-parsers that need to call it.
  setAtomicParseExpression(parseExpression); // For atomicExpressions.js (e.g., for nested expressions in literals)
  setPrimaryExpressionParseExpression(parseExpression); // For primaryExpressions.js (e.g., for `arr[index]`)
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
