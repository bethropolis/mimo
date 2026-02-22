// parser/expressions/primaryExpressions.js
import { TokenType } from "../../lexer/TokenTypes.js";
import { ASTNode } from "../ASTNodes.js";
import { parseAtomicExpression } from "./atomicExpressions.js";

// Forward declaration - will be set by the main parser
let parseExpression;

export function setParseExpression(parseExpressionFn) {
  parseExpression = parseExpressionFn;
}

export function parsePrimaryExpression(parser) {
  let primaryExpr = parseAtomicExpression(parser);

  // Handle postfix operations: property access, array access, safe navigation, function calls
  while (true) {
    const nextToken = parser.peek();
    if (!nextToken) break;

    if (nextToken.type === TokenType.Operator && (nextToken.value === "." || nextToken.value === "?.")) {
      const operatorToken = parser.consume(); // Consume '.' or '?.'

      // Support Safe Index Access: obj?.[index]
      if (operatorToken.value === "?." && parser.match(TokenType.LBracket)) {
        const indexExpr = parseExpression(parser);
        const endBracket = parser.expect(TokenType.RBracket, undefined, 'SYN041', 'Expected closing square bracket for safe array/object access.');
        primaryExpr = ASTNode.SafeArrayAccess(primaryExpr, indexExpr, operatorToken);
        continue;
      }

      // Support Safe Call: func?.()
      if (operatorToken.value === "?." && parser.match(TokenType.LParen)) {
        const args = [];
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
        parser.expect(TokenType.RParen, undefined, 'SYN067', 'Expected a closing parenthesis for safe function call.');
        primaryExpr = ASTNode.SafeCallExpression(primaryExpr, args, operatorToken);
        continue;
      }

      const property = parser.expect(TokenType.Identifier, undefined, 'SYN042', 'Expected property name after dot operator.');

      if (operatorToken.value === '?.') {
        primaryExpr = ASTNode.SafePropertyAccess(primaryExpr, property.value, property);
      } else {
        primaryExpr = ASTNode.PropertyAccess(primaryExpr, property.value, property);
      }
    } else if (nextToken.type === TokenType.LBracket) {
      // Array/Object access: arr[index] or obj[key]
      const startBracketToken = parser.consume(); // consume [
      const indexExpr = parseExpression(parser);
      parser.expect(TokenType.RBracket, undefined, 'SYN041', 'Expected closing square bracket for array/object access (e.g., arr[index]).');
      primaryExpr = ASTNode.ArrayAccess(primaryExpr, indexExpr, startBracketToken);
      // The slicing logic with colon is removed here.
    } else {
      break; // No more postfix operators
    }
  }
  return primaryExpr;
}

export function parseRangeLiteral(parser) {
  const start = parseAtomicExpression(parser);
  const rangeToken = parser.expect(TokenType.Range, undefined, 'SYN045', 'Expected range operator (..) between start and end of range.');
  const end = parseAtomicExpression(parser);
  return ASTNode.RangeLiteral(start, end, rangeToken);
}
