import { generateTokens } from "./compiler/lexer/tokenizer.js";
import { parseTokens } from "./compiler/parser/parser.js";
import { interpret } from "./compiler/execute/interpreter.js";
import { generateCodeJsFromAstArray } from "./converter/js/convert.js";



/**
 * @typedef {import('./compiler/lexer/tokenizer.js').Token} Token
 */

/**
 * @typedef {import('./compiler/parser/parser.js').Node} Node
 */


/**
 * The main class for the Mimo language.
 */
export default class Mimo {
  constructor() {
    // Initialize the environment for variables
    this.env = {};
  }

  /**
   * Tokenize the given code into a list of tokens.
   * @param {string} code - The code to be tokenized.
   * @returns {Promise<Token[]>} A promise that resolves to an array of tokens.
   */
  async tokenize(code) {
    return generateTokens(code);
  }

  /**
   * Parse the list of tokens into an abstract syntax tree (AST).
   * @param {Token[]} tokens - The list of tokens to be parsed.
   * @returns {Promise<Node[]>} A promise that resolves to an array of AST nodes.
   */
  async parse(tokens) {
    return parseTokens(tokens);
  }

  /**
   * Interpret the AST and execute the code.
   * @param {Node[]} program - The AST to be interpreted.
   * @returns {Promise<Object>} A promise that resolves to the result of interpreting the AST.
   */
  async interpret(program) {
    return interpret(program, this.env);
  }

  /**
   * Run the given code by tokenizing, parsing, and interpreting it.
   * @param {string} code - The code to be run.
   * @returns {Promise<{program: Node[], env: Object}>} A promise that resolves to an object containing the AST and the environment.
   */
  async run(code) {
    const tokens = await this.tokenize(code);
    const program = await this.parse(tokens, this.env);
    const env = await this.interpret(program);
    return { program, env };
  }

  /**
   * Clear the environment for variables.
   */
  clearEnv() {
    this.env = {};
  }

  /**
   * Convert the AST to JavaScript code.
   * @param {Node[]} ast - The AST to be converted.
   * @returns {string} The generated JavaScript code.
   */
  toJS(ast) {
    return generateCodeJsFromAstArray(ast);
  }
}