/**
 * @file The main Mimo Interpreter class.
 * This file contains the core Interpreter class that orchestrates the entire
 * execution process, managing environments, call stacks, and dispatching
 * to specialized executors and evaluators.
 */

import { initializeBuiltins } from "./coreBuiltins.js";
import { initializeArrayModule } from "./stdlib/array.js";

import { ErrorHandler } from "./ErrorHandler.js";
import { MimoError } from "./MimoError.js";
import { ExpressionEvaluator } from "./ExpressionEvaluator.js";
import { ModuleLoader } from "./ModuleLoader.js";
import { StatementExecutor } from "./StatementExecutor.js";
import { FunctionValue, ReturnValue } from "./Values.js";
import { Environment } from "./environment.js";

/**
 * The core Mimo interpreter. It walks the AST produced by the parser and
 * executes the program's logic.
 */
export class Interpreter {
  /**
   * Creates a new Interpreter instance.
   * @param {object} adapter - The host adapter for interacting with the underlying system (e.g., file system, console).
   */
  constructor(adapter) {
    this.adapter = adapter;
    this.globalEnv = new Environment(null, true);
    this.currentEnv = this.globalEnv;
    this.expressionEvaluator = new ExpressionEvaluator(this);
    this.statementExecutor = new StatementExecutor(this);
    this.moduleLoader = new ModuleLoader(this);
    this.currentFile = "/repl";
    this.errorHandler = new ErrorHandler();
    this.callStack = [];

    initializeBuiltins(this.globalEnv);
    initializeArrayModule(this.globalEnv);

  }

  /**
   * Interprets an AST and executes the Mimo program. This is the main entry point.
   * @param {object} ast - The Abstract Syntax Tree (Program node) to interpret.
   * @param {string} [filePath="main.mimo"] - The path of the file being executed, for error reporting.
   * @returns {any} The result of the last executed statement.
   * @throws {MimoError} If any lexing, parsing, or runtime errors occur.
   */
  interpret(ast, filePath = "main.mimo") {
    const previousCurrentFile = this.currentFile;
    this.currentFile = filePath;

    try {
      this.pushCallStack('<root>', ast);
      const result = this.visitNode(ast);
      return result;
    } catch (error) {
      if (error instanceof MimoError) {
        throw error;
      } else {
        const lastFrameNode = this.callStack.length > 0 ? this.callStack[this.callStack.length - 1].node : ast;
        const mimoError = this.errorHandler.createRuntimeError(
          `Internal JavaScript error: ${error.message}`,
          lastFrameNode,
          'INT001',
          'An unexpected internal error occurred. This might be a bug in the Mimo interpreter.',
          this.callStack
        );
        throw mimoError;
      }
    } finally {
      this.popCallStack();
      this.currentFile = previousCurrentFile;
    }
  }

  /**
   * Pushes a new frame onto the Mimo call stack for better error reporting.
   * @param {string} functionName - The name of the function being called.
   * @param {object} node - The AST node of the call site (for location info).
   */
  pushCallStack(functionName, node) {
    if (node && node.line !== undefined && node.column !== undefined && node.file !== undefined) {
      this.callStack.push({
        functionName: functionName || '<anonymous>',
        file: node.file,
        line: node.line,
        column: node.column,
        node: node
      });
    }
  }

  /**
   * Pops the top frame from the Mimo call stack.
   */
  popCallStack() {
    this.callStack.pop();
  }

  /**
   * The main visitor dispatch method. It determines whether a node is an
   * expression or a statement and delegates to the appropriate handler.
   * @param {object} node - The AST node to visit.
   * @returns {any} The result of the node's evaluation or execution.
   */
  visitNode(node) {
    if (this.isExpression(node)) {
      return this.expressionEvaluator.evaluateExpression(node);
    }
    return this.statementExecutor.executeStatement(node);
  }

  /**
   * Checks if a given AST node is an expression type.
   * @param {object} node - The AST node to check.
   * @returns {boolean} True if the node is an expression.
   */
  isExpression(node) {
    const expressionTypes = [
      "BinaryExpression", "UnaryExpression", "Identifier", "Literal",
      "ArrayLiteral", "ArrayAccess", "ObjectLiteral", "PropertyAccess",
      "SafePropertyAccess", "SafeArrayAccess", "SafeCallExpression",
      "ModuleAccess", "AnonymousFunction", "TemplateLiteral",
      "CallExpression", "InlineIfExpression", "PipeExpression"
    ];
    return expressionTypes.includes(node.type);
  }

  /**
   * Executes a block of statements within a new or existing environment.
   * @param {object[]} statements - An array of statement AST nodes.
   * @param {Environment} [env=null] - The environment to execute the block in. If null, uses the current environment.
   * @returns {any} The result of the last statement in the block, or a ReturnValue.
   */
  executeBlock(statements, env = null) {
    const previousEnv = this.currentEnv;
    if (env) {
      this.currentEnv = env;
    }

    try {
      this.hoistFunctionDeclarations(statements);
      let result = null;
      for (const statement of statements) {
        result = this.visitNode(statement);
        if (result instanceof ReturnValue) {
          return result;
        }
      }
      return result;
    } finally {
      if (env) {
        this.currentEnv = previousEnv;
      }
    }
  }

  hoistFunctionDeclarations(statements) {
    for (const statement of statements) {
      if (statement?.type === "FunctionDeclaration") {
        if (!this.currentEnv.hasInCurrentScope(statement.name)) {
          this.currentEnv.define(statement.name, new FunctionValue(statement, this.currentEnv));
        }
      }
    }
  }
}
