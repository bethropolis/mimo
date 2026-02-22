// parser/parseStatement.js
import { TokenType } from "../lexer/TokenTypes.js";
import { parseExpression } from "./parserExpressions.js"; // Needed if expressions can be statements

// Import ALL individual statement parser functions here (ensure names match your files)
import {
  parseBreakStatement,
  parseContinueStatement,
  parseForStatement,
  parseIfStatement,
  parseGuardStatement,
  parseLoopStatement,
  parseTryStatement,
  parseWhileStatement,
} from "./statements/controlFlowParsers.js";
import {
  parseCallStatement,
  parseFunctionDeclaration,
  parseReturnStatement,
  parseShowStatement,
  parseThrowStatement,
} from "./statements/functionParsers.js";
import { parseMatchStatement } from "./statements/patternMatchParsers.js";
import {
  parseVariableOrAssignment,
  parseDestructuringStatement,
} from "./statements/variableParsers.js"; // Corrected import
import {
  parseImportStatement,
  parseExportStatement,
} from "./statements/moduleParsers.js";

// NOTE: parseAnonymousFunction is used by parseAtomicExpression (an expression parser), not directly here.
// No imports needed for parseClassDeclaration, parseEnumDeclaration, parseInterfaceDeclaration,
// parseTypeAliasDeclaration, parseModuleBlock as they are not implemented yet.
// No parseExpressionStatement import is needed, we will define it if Mimo supports it.

/**
 * Parses an expression used as a standalone statement.
 * This is for cases where an expression (like `1+2` or a function call without `call` keyword)
 * is a valid statement in itself.
 * @param {import("./Parser.js").Parser} parser - The parser instance.
 * @returns {object} The AST node for the expression statement.
 */
function parseExpressionStatement(parser) {
  const expression = parseExpression(parser);
  // Mimo doesn't have an explicit ExpressionStatement AST node in ASTNodes.js
  // so for now, we just return the expression itself.
  // The interpreter will then evaluate this expression as a statement.
  return expression;
}

/**
 * Parses a single Mimo statement. This function acts as a dispatcher.
 * It relies on the passed `parser` instance to access its methods (peek, consume, error, etc.)
 * and other parsing helpers.
 * @param {import("./Parser.js").Parser} parser - The parser instance.
 * @returns {object} The AST node for the parsed statement.
 */
export function parseStatement(parser) {
  const token = parser.peek(); // Get the current token
  if (!token || parser.isAtEnd()) {
    // Check isAtEnd for robustness
    parser.error(
      "Unexpected end of input.",
      null, // No specific token to point to at EOF
      "SYN000",
      "Expected a statement or expression, but found end of file."
    );
  }

  if (token.type === TokenType.Keyword) {
    switch (token.value) {
      case "destructure":
        return parseDestructuringStatement(parser);
      case "set":
      case "let":
      case "const":
      case "global":
        // Variable declarations and assignments
        return parseVariableOrAssignment(parser, false, token); // Correctly calls existing function
      case "if":
        return parseIfStatement(parser);
      case "guard":
        return parseGuardStatement(parser);
      case "for":
        return parseForStatement(parser);
      case "while":
        return parseWhileStatement(parser);
      case "loop": // Assuming 'loop' is a keyword for infinite loop or similar
        return parseLoopStatement(parser);
      case "break":
        return parseBreakStatement(parser);
      case "continue":
        return parseContinueStatement(parser);
      case "try":
        return parseTryStatement(parser); // Corrected function name
      case "function":
        return parseFunctionDeclaration(parser, false);
      case "call":
        return parseCallStatement(parser);
      case "return":
        return parseReturnStatement(parser);
      case "show":
        return parseShowStatement(parser);
      case "throw":
        return parseThrowStatement(parser);
      case "match":
        return parseMatchStatement(parser);
      case "import":
        return parseImportStatement(parser); // Direct import parsing
      case "export":
        return parseExportStatement(parser); // Direct export parsing
      default:
        // If a keyword is encountered that doesn't start a known statement,
        // AND it's not a keyword that can start an expression (like 'true', 'false', 'null'),
        // then it's an error.
        // For Mimo, keywords like 'true', 'false', 'null' are literals, not statements.
        // So, if a keyword falls through here, it IS an error.
        parser.error(
          `Unexpected keyword '${token.value}' at the start of a statement.`,
          token,
          "SYN005",
          "Expected a statement keyword (like 'set', 'if', 'function', 'call', 'show', etc.)."
        );
      // This default case should always throw if it's a keyword.
    }
  }

  // Check for LabeledStatement
  if (token.type === TokenType.Identifier) {
    const nextToken = parser.peek(1);
    if (nextToken && nextToken.type === TokenType.Colon) {
      const labelToken = parser.consume(); // Consume identifier
      parser.consume(); // Consume colon
      const statement = parseStatement(parser);
      // Wait, ASTNode is not imported! I'll just use inline object or import it. Let me import ASTNode at the top.
      return {
        type: "LabeledStatement",
        label: labelToken.value,
        statement: statement,
        line: labelToken.line,
        column: labelToken.column,
        start: labelToken.start,
        length: labelToken.length,
        file: labelToken.file,
      };
    }
  }

  // If the first token is NOT a keyword, it's an expression.
  // This handles cases where expressions (like `* x 2` or `myVar`) are standalone statements.
  // Call parseExpressionStatement to handle it.
  return parseExpressionStatement(parser); // <--- ADD THIS LINE HERE

  // The original `parser.error` here (SYN001) should now only be reachable if parseExpressionStatement
  // itself fails to parse anything and doesn't throw, or if an unexpected token appears and parser.error is called.
  // But `parseExpressionStatement` should throw its own specific errors if it can't parse an expression.
  // So, this final `parser.error` is effectively redundant if `parseExpressionStatement` is robust.
  // We can remove it and let `parseExpressionStatement`'s errors propagate.
  /*
  parser.error(
    `Unexpected token '${token.value}' (${token.type}) when expecting a statement.`,
    token,
    "SYN001",
    "Expected a statement keyword (like 'set', 'if', 'function', 'call', 'show', etc.) or a valid expression that can form a statement."
  );
  */
}
