import { generateTokens } from "./compiler/lexer/tokenizer";
import { parseTokens } from "./compiler/parser/parser";
import { interpret } from "./compiler/execute/interpreter";
import { generateGoCodeFromAst } from "./converter/go/convert";
import { generateCodeJsFromAstArray } from "./converter/js/convert";

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
    return await this.interpret(program);
  }

  // Convert the AST to JavaScript code
  toJS(ast) {
    return generateCodeJsFromAstArray(ast);
  }

  // Convert the AST to Go code
  toGO(ast) {
    return generateGoCodeFromAst(ast);
  }
}