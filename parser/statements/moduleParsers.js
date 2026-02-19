import { TokenType } from "../../lexer/TokenTypes.js";
import { ASTNode } from "../ASTNodes.js";
import { parseVariableOrAssignment } from "./variableParsers.js";
import { parseFunctionDeclaration } from "./functionParsers.js";


export function parseImportStatement(parser) {
  const importToken = parser.expectKeyword("import", 'SYN073', 'Expected "import" keyword.');
  const pathToken = parser.expect(TokenType.String, undefined, 'SYN074', 'Expected a string literal for the module path (e.g., "my_module").');
  parser.expectKeyword("as", 'SYN075', 'Expected "as" keyword for module aliasing.');
  const aliasToken = parser.expect(TokenType.Identifier, undefined, 'SYN076', 'Expected an identifier for the module alias.');

  return ASTNode.ImportStatement(
    pathToken.value,
    aliasToken.value,
    importToken
  );
}

export function parseExportStatement(parser) {
    const exportToken = parser.expectKeyword("export", 'SYN077', 'Expected "export" keyword.');

    const nextToken = parser.peek();
    if (!nextToken || parser.isAtEnd()) { // Check isAtEnd as well
        parser.error("Unexpected end of input after 'export'.", exportToken, 'SYN078', "Expected a variable or function declaration to export.");
    }
    if (nextToken.type === TokenType.Keyword) {
        switch (nextToken.value) {
            case "set":
            case "let":
            case "const":
            case "global":
                // Pass exportToken as the location token for the AST node
                return parseVariableOrAssignment(parser, true, exportToken);
            case "function":
                // Pass exportToken as the location token for the AST node
                return parseFunctionDeclaration(parser, true, exportToken);
            default:
                parser.error(
                    `Cannot export statement of type '${nextToken.value}'. Expected a declaration.`,
                    nextToken,
                    'SYN079',
                    "Only 'set', 'let', 'const', 'global', or 'function' declarations can be exported."
                );
        }
    }
    // If not a keyword, it must be an error because export must be followed by a declaration keyword.
    parser.error("Expected a declaration keyword (set, let, const, global, function) after 'export'.", nextToken, 'SYN080', 'Only variable and function declarations can be exported.');
}