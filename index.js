import { generateTokens } from "./compiler/lexer/tokenizer.js";
import { parseTokens } from "./compiler/parser/parser.js";
import { interpret } from "./compiler/execute/interpreter.js";
import { generateCodeJsFromAstArray } from "./converter/js/convert.js";

// The main class for the Mimo language
export default class Mimo {
  constructor() {
    // Initialize the environment for variables
    this.env = {};
  }

  // Tokenize the given code into a list of tokens
  async tokenize(code) {
    return generateTokens(code);
  }

  // Parse the list of tokens into an abstract syntax tree (AST)
  async parse(tokens) {
    return parseTokens(tokens);
  }

  // Interpret the AST and execute the code
  async interpret(program) {
    return interpret(program, this.env);
  }

  // Run the given code by tokenizing, parsing, and interpreting it
  async run(code) {
    const tokens = await this.tokenize(code);
    const program = await this.parse(tokens);
    const env = await this.interpret(program);
    return { program, env };
  }

  // Convert the AST to JavaScript code
  toJS(ast) {
    return generateCodeJsFromAstArray(ast);
  }
}

