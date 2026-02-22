// parser/expressions/atomicExpressions.js
import { TokenType } from "../../lexer/TokenTypes.js";
import { ASTNode } from "../ASTNodes.js";
import { parseBlock } from "../parserUtils.js";
import { parseAnonymousFunction, parseCallExpressionParts } from "../statements/functionParsers.js"; // Import the new function

// Forward declaration - will be set by the main parser
let parseExpression;

export function setParseExpression(parseExpressionFn) {
  parseExpression = parseExpressionFn;
}

export function parseAtomicExpression(parser) {
  const token = parser.peek();

  switch (token?.type) {
    case TokenType.Identifier: {
      const consumedToken = parser.consume();
      return ASTNode.Identifier(consumedToken.value, consumedToken);
    }
    case TokenType.Number: {
      const consumedToken = parser.consume();
      return ASTNode.Literal(Number.parseFloat(consumedToken.value), consumedToken);
    }
    case TokenType.String: {
      const consumedToken = parser.consume();
      return ASTNode.Literal(consumedToken.value, consumedToken);
    }
    case TokenType.Boolean: {
      // The lexer already converts 'true'/'false' strings to actual booleans.
      const consumedToken = parser.consume();
      return ASTNode.Literal(consumedToken.value, consumedToken);
    }
    case TokenType.Null: {
      const consumedToken = parser.consume();
      return ASTNode.Literal(null, consumedToken);
    }
    case TokenType.Backtick:
      return parseTemplateLiteral(parser);
    case TokenType.LBracket:
      return parseArrayLiteral(parser);
    case TokenType.LBrace:
      return parseObjectLiteral(parser);
    case TokenType.LParen: {
      parser.consume(); // consume opening parenthesis
      const expr = parseExpression(parser);
      parser.expect(TokenType.RParen, undefined, 'SYN018', 'Expected a closing parenthesis for grouped expression.');
      return expr;
    }
    case TokenType.Keyword:
      if (token.value === "function" || token.value === "fn") {
        parser.consume(); // CONSUME 'function' or 'fn'
        return parseAnonymousFunction(parser, token.value === "fn");
      }
      if (token.value === "call") {
        parser.consume(); // CONSUME 'call' keyword
        return parseCallExpressionParts(parser, token);
      }
      parser.error(`Unexpected keyword "${token.value}" in expression context.`, token, 'SYN010');
      break;
    default:
      parser.error(`Unexpected token in expression "${token?.value}".`, token, 'SYN010', 'Expected a literal, identifier, array, object, or function.');
  }
}

export function parseArrayLiteral(parser) {
  const startBracket = parser.expect(TokenType.LBracket, undefined, 'SYN011', 'Expected an opening square bracket to start an array literal.');
  const elements = [];

  if (parser.peek()?.type !== TokenType.RBracket) {
    if (parser.peek()?.type === TokenType.Spread) {
      const spreadToken = parser.consume();
      const argument = parseExpression(parser);
      elements.push(ASTNode.SpreadElement(argument, spreadToken));
    } else {
      elements.push(parseExpression(parser));
    }

    while (parser.peek()?.type === TokenType.Comma) {
      parser.consume();
      if (parser.peek()?.type === TokenType.RBracket) break;

      if (parser.peek()?.type === TokenType.Spread) {
        const spreadToken = parser.consume();
        const argument = parseExpression(parser);
        elements.push(ASTNode.SpreadElement(argument, spreadToken));
      } else {
        elements.push(parseExpression(parser));
      }
    }
  }

  parser.expect(TokenType.RBracket, undefined, 'SYN012', 'Expected a closing square bracket to end an array literal.');
  return ASTNode.ArrayLiteral(elements, startBracket);
}

export function parseObjectLiteral(parser) {
  const startBrace = parser.expect(TokenType.LBrace, undefined, 'SYN013', 'Expected an opening curly brace to start an object literal.');
  const properties = [];

  if (parser.peek()?.type !== TokenType.RBrace) {
    let keyToken = parser.expect(TokenType.Identifier, undefined, 'SYN014', 'Expected a property name (identifier) in object literal.');
    parser.expect(TokenType.Colon, undefined, 'SYN015', 'Expected a colon ":" after property name in object literal.');
    const value = parseExpression(parser);
    properties.push({ key: keyToken.value, value });

    while (parser.peek()?.type === TokenType.Comma) {
      parser.consume();
      if (parser.peek()?.type === TokenType.RBrace) break;

      keyToken = parser.expect(TokenType.Identifier, undefined, 'SYN016', 'Expected another property name (identifier) after comma in object literal.');
      parser.expect(TokenType.Colon, undefined, 'SYN017', 'Expected a colon ":" after property name in object literal.');
      const value = parseExpression(parser);
      properties.push({ key: keyToken.value, value });
    }
  }

  parser.expect(TokenType.RBrace, undefined, 'SYN018', 'Expected a closing curly brace to end an object literal.');
  return ASTNode.ObjectLiteral(properties, startBrace);
}


export function parseTemplateLiteral(parser) {
  const startToken = parser.expect(TokenType.Backtick, '`', 'SYN104', 'Expected backtick ` to start a template literal.');
  const parts = [];

  while (!parser.isAtEnd() && parser.peek()?.type !== TokenType.Backtick) {
    const token = parser.peek();

    if (token.type === TokenType.StringFragment) {
      // It's a plain string part, like "Hello, "
      parser.consume();
      if (token.value.length > 0) {
        parts.push(ASTNode.Literal(token.value, token));
      }
    } else if (token.type === TokenType.InterpolationStart) {
      // It's an expression part, like ${name}
      parser.consume(); // consume '${'
      const expr = parseExpression(parser);
      parts.push(expr);
      parser.expect(TokenType.InterpolationEnd, '}', 'SYN105', 'Expected closing brace } after expression in template literal.');
    } else {
      parser.error(`Unexpected token '${token.value}' inside a template literal.`, token, 'SYN106');
    }
  }

  parser.expect(TokenType.Backtick, '`', 'SYN107', 'Expected backtick ` to end a template literal.');
  return ASTNode.TemplateLiteral(parts, startToken);
}
