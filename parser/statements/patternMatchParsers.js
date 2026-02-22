import { TokenType } from "../../lexer/TokenTypes.js";
import { ASTNode } from "../ASTNodes.js";
import { parseExpression } from "../parserExpressions.js";
import { parseBlock, isBlockEnd } from "../parserUtils.js";

export function parseMatchStatement(parser) {
  const matchToken = parser.expectKeyword("match", 'SYN081', 'Expected "match" keyword to start a match statement.');
  const discriminant = parseExpression(parser);

  const cases = [];

  // Parse case clauses
  while (
    parser.peek()?.type === TokenType.Keyword &&
    (parser.peek()?.value === "case" || parser.peek()?.value === "default")
  ) {
    if (parser.peek()?.value === "case") {
      const caseToken = parser.expectKeyword("case", 'SYN082', 'Expected "case" keyword for a match clause.');
      const pattern = parsePattern(parser);

      let guard = null;
      if (parser.matchKeyword("when")) {
        guard = parseExpression(parser);
      }

      parser.expect(TokenType.Colon, undefined, 'SYN083', 'Expected a colon (:) after the pattern in a match clause.');
      const consequent = parseBlock(parser, ["case", "default", "end"]);

      cases.push(ASTNode.CaseClause(pattern, guard, consequent, caseToken));
    } else if (parser.peek()?.value === "default") {
      const defaultToken = parser.expectKeyword("default", 'SYN084', 'Expected "default" keyword for the fallback match clause.');
      parser.expect(TokenType.Colon, undefined, 'SYN085', 'Expected a colon (:) after "default" in a match clause.');
      const consequent = parseBlock(parser, ["case", "default", "end"]);

      cases.push(ASTNode.CaseClause(null, null, consequent, defaultToken)); // null pattern and guard for default
    }
  }
  if (cases.length === 0) {
    parser.error("Match statement must have at least one 'case' or 'default' clause.", matchToken, 'SYN085A', "Add at least one 'case ... : ...' or 'default: ...' block.");
  }

  parser.expectKeyword("end", 'SYN086', 'Expected "end" keyword to close match statement.');
  return ASTNode.MatchStatement(discriminant, cases, matchToken);
}

export function parsePattern(parser) {
  const token = parser.peek();

  if (token?.type === TokenType.LBracket) {
    // Array pattern: [a, b] or [1, 2, 3]
    const bracketToken = parser.expect(TokenType.LBracket, undefined, 'SYN087', 'Expected an opening square bracket to start an array pattern.');
    const elements = [];

    if (parser.peek()?.type !== TokenType.RBracket) {
      do {
        elements.push(parsePatternElement(parser));
      } while (parser.match(TokenType.Comma));
    }

    parser.expect(TokenType.RBracket, undefined, 'SYN088', 'Expected a closing square bracket to end an array pattern.');
    return ASTNode.ArrayPattern(elements, bracketToken);
  }
  // Simple pattern: literal, identifier
  return parsePatternElement(parser);
}

export function parsePatternElement(parser) {
  const token = parser.peek();
  if (!token) {
    parser.error("Unexpected end of input while parsing pattern element.", parser.peek(-1) || parser.tokens[0], 'SYN088A', "A pattern element (literal, identifier, or array) is expected here.");
  }

  switch (token.type) {
    case TokenType.LBracket: // Nested array pattern
      {
        const bracketToken = parser.expect(TokenType.LBracket, undefined, 'SYN089', 'Expected an opening square bracket for nested array pattern.');
        const elements = [];
        if (parser.peek()?.type !== TokenType.RBracket) {
          do {
            elements.push(parsePatternElement(parser));
          } while (parser.match(TokenType.Comma));
        }
        parser.expect(TokenType.RBracket, undefined, 'SYN090', 'Expected a closing square bracket for nested array pattern.');
        return ASTNode.ArrayPattern(elements, bracketToken);
      }
    case TokenType.Number:
      {
        const numToken = parser.consume();
        // Ensure the number is an integer for pattern matching if required by language spec
        // For now, allowing any number literal.
        return ASTNode.Literal(Number.parseFloat(numToken.value), numToken); // Or parseInt if only integers allowed
      }
    case TokenType.String:
      {
        const strToken = parser.consume();
        return ASTNode.Literal(strToken.value, strToken);
      }
    case TokenType.Boolean: // Lexer produces this for true/false literals
      {
        const boolToken = parser.consume();
        return ASTNode.Literal(boolToken.value === "true" || boolToken.value === true, boolToken);
      }
    case TokenType.Null: // Lexer produces this for null literal
      {
        const nullToken = parser.consume();
        return ASTNode.Literal(null, nullToken);
      }
    case TokenType.Identifier:
      {
        // Could be a variable to bind or a named constant to match (e.g. if you have enums or consts)
        // For now, assume it's a variable to bind.
        const idToken = parser.consume();
        return ASTNode.Identifier(idToken.value, idToken);
      }
    default:
      parser.error(
        `Unexpected token '${token.value}' (${token.type}) in pattern. Expected a literal, identifier, or array pattern.`,
        token,
        'SYN091',
        'Patterns can be simple values (like 10, "hello", true), identifiers (to bind values), or array patterns (like [a, b]).'
      );
  }
}

