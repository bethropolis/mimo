// In: parser/statements/variableParsers.js

import { TokenType } from "../../lexer/TokenTypes.js";
import { ASTNode } from "../ASTNodes.js";
import { parseExpression } from "../parserExpressions.js";

// Helper function that parses a "left-hand-side" expression,
// which can be a simple identifier or a chain of property/bracket accesses.
function parseAssignable(parser) {
    let expr = parser.parseIdentifier('SYN097', "Expected an identifier for the variable name or assignment target.");

    while (true) {
        const token = parser.peek();
        if (token?.type === TokenType.Operator && token.value === '.') {
            parser.consume(); // consume '.'
            const property = parser.expect(TokenType.Identifier, undefined, 'SYN098', 'Expected property name after dot.');
            expr = ASTNode.PropertyAccess(expr, property.value, property);
        } else if (token?.type === TokenType.LBracket) {
            parser.consume(); // consume '['
            const index = parseExpression(parser);
            parser.expect(TokenType.RBracket, undefined, 'SYN100', "Expected a closing ']' after index.");
            expr = ASTNode.ArrayAccess(expr, index, token);
        } else {
            break; // No more accessors
        }
    }
    return expr;
}


export function parseVariableOrAssignment(parser, isExported = false, exportToken) {
    const kindToken = parser.expectKeyword(['set', 'let', 'const', 'global'], 'SYN092');
    const astNodeLocationToken = exportToken || kindToken;

    const nextToken = parser.peek();
    if (nextToken && (nextToken.type === TokenType.LBracket || nextToken.type === TokenType.LBrace)) {
        const pattern = parseDestructuringPattern(parser);
        const value = parseExpression(parser);
        return ASTNode.VariableDeclaration(pattern, value, kindToken.value, isExported, astNodeLocationToken);
    }

    // We need the raw token for its position, not just the AST node.
    const identifierToken = parser.expect(TokenType.Identifier, undefined, 'SYN097', "Expected an identifier for the variable name.");

    // -- WHITESPACE-SENSITIVE AMBIGUITY RESOLUTION --
    const followingToken = parser.peek();
    let isMemberAssignment = false;

    if (followingToken) {
        if (followingToken.type === TokenType.Operator && followingToken.value === '.') {
            // `obj.` is unambiguously a member assignment.
            isMemberAssignment = true;
        } else if (followingToken.type === TokenType.LBracket) {
            // `arr[` vs `arr [`
            // Your brilliant idea: check if there's a space.
            const hasNoSpace = (followingToken.start === identifierToken.start + identifierToken.length);
            if (hasNoSpace) {
                isMemberAssignment = true;
            }
        }
    }

    // --- DISPATCH TO THE CORRECT PARSING PATH ---

    if (isMemberAssignment) {
        // --- PATH 1: MEMBER ASSIGNMENT (e.g., set arr[0] 99) ---
        if (kindToken.value !== 'set') {
            parser.error(`The '${kindToken.value}' keyword is for declarations. Use 'set' for direct member assignment.`, kindToken, 'SYN102');
        }

        let lhs = ASTNode.Identifier(identifierToken.value, identifierToken);

        // Loop to consume the full accessor chain (e.g., obj.prop[0].name)
        while (true) {
            const currentToken = parser.peek();
            const hasNoSpace = currentToken && (currentToken.start === parser.peek(-1).start + parser.peek(-1).length);

            if (currentToken?.type === TokenType.Operator && currentToken.value === '.') {
                parser.consume(); // consume '.'
                const property = parser.expect(TokenType.Identifier, undefined, 'SYN098', 'Expected property name after dot.');
                lhs = ASTNode.PropertyAccess(lhs, property.value, property);
            } else if (currentToken?.type === TokenType.LBracket && hasNoSpace) {
                parser.consume(); // consume '['
                const index = parseExpression(parser);
                parser.expect(TokenType.RBracket, undefined, 'SYN100', "Expected a closing ']' after index.");
                lhs = ASTNode.ArrayAccess(lhs, index, currentToken);
            } else {
                break; // No more accessors
            }
        }

        const value = parseExpression(parser);

        if (lhs.type === 'PropertyAccess') {
            return ASTNode.PropertyAssignment(lhs.object, lhs.property, value, astNodeLocationToken);
        } else if (lhs.type === 'ArrayAccess') {
            return ASTNode.BracketAssignment(lhs.object, lhs.index, value, astNodeLocationToken);
        } else {
            parser.error("Invalid member assignment target.", lhs, 'SYN103');
        }

    } else {
        // --- PATH 2: VARIABLE DECLARATION (e.g., let x, set arr [1,2,3]) ---
        const value = parseExpression(parser);
        return ASTNode.VariableDeclaration(identifierToken.value, value, kindToken.value, isExported, astNodeLocationToken);
    }
}

// NEW function to parse an object pattern like {a, b}
function parseObjectPattern(parser) {
    const startBrace = parser.expect(TokenType.LBrace, undefined, 'SYN115', 'Expected "{" to start object destructuring pattern.');
    const properties = [];

    if (parser.peek()?.type !== TokenType.RBrace) {
        do {
            // Each property in the pattern must be an identifier.
            properties.push(parser.parseIdentifier('SYN116', 'Expected an identifier for property in object destructuring.'));
        } while (parser.match(TokenType.Comma));
    }

    parser.expect(TokenType.RBrace, undefined, 'SYN117', 'Expected "}" to close object destructuring pattern.');
    return ASTNode.ObjectPattern(properties, startBrace);
}

// (The destructuring parsers below remain unchanged and correct)
function parseDestructuringPattern(parser) {
    const token = parser.peek();

    // Dispatch based on the opening token.
    if (token.type === TokenType.LBracket) {
        // Array Pattern: [a, b]
        const startBracket = parser.consume();
        const variables = [];
        if (parser.peek()?.type !== TokenType.RBracket) {
            do {
                variables.push(parser.parseIdentifier("SYN110", "Expected an identifier in destructuring pattern."));
            } while (parser.match(TokenType.Comma));
        }
        parser.expect(TokenType.RBracket, undefined, "SYN111", 'Expected a closing "]" for array destructuring pattern.');
        return ASTNode.ArrayPattern(variables, startBracket);
    } else if (token.type === TokenType.LBrace) {
        // Object Pattern: {name, age}
        return parseObjectPattern(parser); // Call our new helper
    }

    parser.error('Expected an array or object pattern (e.g., [a, b] or {a, b}) for destructuring.', token, 'SYN112');
}

export function parseDestructuringStatement(parser) {
    const destructureToken = parser.expectKeyword("destructure", "SYN113");
    const pattern = parseDestructuringPattern(parser);
    parser.expectKeyword("from", "SYN114", 'Expected "from" keyword after destructuring pattern.');
    const expression = parseExpression(parser);
    return ASTNode.DestructuringAssignment(pattern, expression, destructureToken);
}