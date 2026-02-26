import { MimoError } from "../../interpreter/MimoError.js";
import { TokenType } from "../../lexer/TokenTypes.js";
import { ASTNode } from "../ASTNodes.js";
import { parseExpression } from "../parserExpressions.js";
import { isBlockEnd, parseBlock } from "../parserUtils.js";

export function parseDecorator(parser) {
  const atToken = parser.expect(TokenType.At, undefined, 'SYN140', 'Expected "@" at the start of a decorator.');
  const nameToken = parser.expect(TokenType.Identifier, undefined, 'SYN141', 'Expected decorator name after "@".');
  const name = ASTNode.Identifier(nameToken.value, nameToken);

  let args = null;
  if (parser.match(TokenType.LParen)) {
    args = [];
    if (parser.peek()?.type !== TokenType.RParen) {
      do {
        args.push(parseExpression(parser));
      } while (parser.match(TokenType.Comma));
    }
    parser.expect(TokenType.RParen, undefined, 'SYN142', 'Expected closing parenthesis after decorator arguments.');
  }

  return ASTNode.Decorator(name, args, atToken);
}

export function parseDecorators(parser) {
  const decorators = [];
  while (parser.peek()?.type === TokenType.At) {
    decorators.push(parseDecorator(parser));
  }
  return decorators;
}

export function parseFunctionDeclaration(parser, isExported = false, exportToken = null, decorators = []) {
  // THIS IS THE FIX: This function now consumes the 'function' keyword itself.
  const funcToken = parser.expectKeyword("function", 'SYNXXX', 'Expected "function" keyword.');

  // The AST node's location should be the 'export' token if it exists, otherwise the 'function' token.
  const astNodeLocationToken = exportToken || funcToken;

  const nameToken = parser.expect(TokenType.Identifier, undefined, 'SYN054', 'Expected a function name (identifier).');
  const name = nameToken.value;

  parser.expect(TokenType.LParen, undefined, 'SYN055', 'Expected an opening parenthesis for function parameters.');

  const params = [];
  const defaults = {};
  let restParam = null;
  let hasEncounteredDefault = false;
  let hasEncounteredRest = false;

  if (parser.peek()?.type !== TokenType.RParen) {
    do {
      if (hasEncounteredRest) {
        parser.error("No parameters allowed after a rest parameter.", parser.peek(), 'SYN060');
      }

      if (parser.match(TokenType.Spread)) {
        const spreadToken = parser.peek(-1);
        const paramNameToken = parser.expect(TokenType.Identifier, undefined, 'SYN056', 'Expected an identifier for rest parameter.');

        restParam = ASTNode.Identifier(paramNameToken.value, spreadToken);
        hasEncounteredRest = true;
        if (parser.peek()?.type === TokenType.Comma) {
          parser.error("Rest parameter must be the last parameter.", parser.peek(-1), 'SYN063');
        }
        break;
      } else {
        const paramNode = parser.parseIdentifier('SYN021', 'Expected a parameter name (identifier).');
        params.push(paramNode); // Push the entire node

        if (parser.match(TokenType.Colon)) {
          defaults[paramNode.name] = parseExpression(parser); // Key by name
          hasEncounteredDefault = true;
        } else if (hasEncounteredDefault && !hasEncounteredRest) {
          parser.error("Parameter without default value cannot follow parameter with default value.", paramNode, 'SYN_DEFAULT_ORDER');
        }
      }
    } while (parser.match(TokenType.Comma));
  }

  parser.expect(TokenType.RParen, undefined, 'SYN026', 'Expected a closing parenthesis for function parameters.');

  const body = parseBlock(parser);
  const endToken = parser.expect(TokenType.Keyword, "end", 'SYN027', 'Expected "end" keyword to close function declaration.');

  return ASTNode.FunctionDeclaration(
    name,
    params,
    defaults,
    restParam,
    body,
    isExported, // Pass isExported flag
    decorators, // Pass practitioners decorators
    astNodeLocationToken, // Pass the correct location token
    endToken
  );
}

// In: parser/statements/functionParsers.js

export function parseAnonymousFunction(parser, isFn = false) {
  const funcToken = parser.peek(-1); // The `function` or `fn` keyword was just consumed.

  if (!isFn) {
    parser.expect(TokenType.LParen, undefined, 'SYN020', 'Expected an opening parenthesis for function parameters.');
  }

  const params = [];
  const defaults = {};
  let restParam = null;
  let hasEncounteredDefault = false;
  let hasEncounteredRest = false;

  if (parser.peek()?.type !== TokenType.RParen) {
    do {
      if (hasEncounteredRest) {
        parser.error("No parameters allowed after a rest parameter.", parser.peek(), 'SYN060');
      }

      if (parser.match(TokenType.Spread)) {
        const spreadToken = parser.peek(-1);
        const paramNameToken = parser.expect(TokenType.Identifier, undefined, 'SYN056', 'Expected an identifier for rest parameter.');
        restParam = ASTNode.Identifier(paramNameToken.value, spreadToken);
        hasEncounteredRest = true;
        if (parser.peek()?.type === TokenType.Comma) {
          parser.error("Rest parameter must be the last parameter.", parser.peek(-1), 'SYN063');
        }
        break;
      } else {
        const paramNode = parser.parseIdentifier('SYN021', 'Expected a parameter name (identifier).');
        params.push(paramNode); // Push the entire Identifier node

        if (parser.match(TokenType.Colon)) {
          defaults[paramNode.name] = parseExpression(parser);
          hasEncounteredDefault = true;
        } else if (hasEncounteredDefault && !hasEncounteredRest) {
          parser.error("Parameter without default value cannot follow parameter with default value.", paramNode, 'SYN_DEFAULT_ORDER');
        }
      }

      // Separator handling: '->' is always allowed. Comma is only for standard 'function' syntax.
      if (parser.match(TokenType.Operator, "->")) {
        // Arrow found — done with params, move to body
        break;
      } else if (parser.match(TokenType.Comma)) {
        if (isFn) {
          parser.error(
            "Comma-separated parameters are not supported in 'fn' syntax. Use '->' to separate parameters from the body.",
            parser.peek(-1),
            'SYN135',
            "Write: fn x y -> expression end or use 'function' keyword for multi-param functions."
          );
        }
        // If !isFn, we just consumed the comma normally, which is correct for standard syntax.
      }
    } while (parser.peek()?.type !== TokenType.RParen && parser.peek()?.value !== "->");

    // In case there were NO params but we still use the -> like `(fn -> body)`
    if (parser.peek()?.value === "->") {
      parser.consume(); // Consume the arrow
    }
  }

  if (!isFn) {
    parser.expect(TokenType.RParen, undefined, 'SYN026', 'Expected a closing parenthesis for function parameters.');
  }
  const body = parseBlock(parser);
  const endToken = parser.expect(TokenType.Keyword, "end", 'SYN027', 'Expected "end" keyword to close function declaration.');

  return ASTNode.AnonymousFunction(
    params,
    defaults,
    restParam,
    body,
    funcToken,
    endToken
  );
}

export function parseCallExpressionParts(parser, callToken) {
  let callee;
  // Allow module access like MyModule.myFunction or simple identifier
  const firstToken = parser.expect(TokenType.Identifier, undefined, 'SYN064', 'Expected a function name (identifier) or module name after "call".');

  if (parser.match(TokenType.Operator, ".")) {
    const propertyToken = parser.expect(TokenType.Identifier, undefined, 'SYN065', 'Expected a property name (identifier) after "." for module access.');
    callee = ASTNode.ModuleAccess(firstToken.value, propertyToken.value, firstToken); // firstToken is start of module.prop
  } else {
    callee = ASTNode.Identifier(firstToken.value, firstToken);
  }

  parser.expect(TokenType.LParen, undefined, 'SYN066', 'Expected an opening parenthesis for function arguments.');
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

  parser.expect(TokenType.RParen, undefined, 'SYN067', 'Expected a closing parenthesis for function arguments.');

  return ASTNode.CallExpression(callee, args, callToken); // Returns a CallExpression AST node
}

export function parseCallStatement(parser) {
  const callToken = parser.expectKeyword("call", 'SYN063', 'Expected "call" keyword to initiate a function call.');

  // Use the new reusable function to parse the `callee(args)` part
  const callExpression = parseCallExpressionParts(parser, callToken); // Pass the callToken for location

  let destination = null;
  if (parser.match(TokenType.Operator, "->")) {
    const destinationToken = parser.expect(TokenType.Identifier, undefined, 'SYN069', 'Expected an identifier for the assignment destination after "->".');
    destination = ASTNode.Identifier(destinationToken.value, destinationToken); // Store as ASTNode.Identifier
  }

  // Now, create the CallStatement AST node.
  // It will embed the CallExpression.
  return ASTNode.CallStatement(
    callExpression.callee, // The function being called
    callExpression.arguments, // The arguments to the call
    destination, // The optional destination for the result
    callToken // The original 'call' token for location
  );
}

export function parseReturnStatement(parser) {
  const returnToken = parser.expectKeyword("return", 'SYN070', 'Expected "return" keyword.');
  let argument = null;

  // If the next token is the end of a block, there is no return value.
  // This handles `return end` or `return else` etc.
  const nextToken = parser.peek();
  if (
    parser.isAtEnd() ||
    (nextToken.type === TokenType.Keyword && ['end', 'else', 'catch', 'case', 'default'].includes(nextToken.value))
  ) {
    // This is a `return` statement with no value, so argument remains null.
  } else {
    // Otherwise, there MUST be an expression to return.
    argument = parseExpression(parser);
  }

  return ASTNode.ReturnStatement(argument, returnToken);
}

export function parseShowStatement(parser) {
  const showToken = parser.expectKeyword("show", 'SYN071', 'Expected "show" keyword.');
  const expression = parseExpression(parser);
  return ASTNode.ShowStatement(expression, showToken);
}

export function parseThrowStatement(parser) {
  const throwToken = parser.expectKeyword("throw", 'SYN072', 'Expected "throw" keyword.');
  const argument = parseExpression(parser);
  return ASTNode.ThrowStatement(argument, throwToken);
}
