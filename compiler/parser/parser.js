import { parseStatement } from "./parseStatement.js";


/**
 * @typedef {import('../lexer/tokenizer.js').Token} Token
 */

/**
 * @typedef {Object} Node
 * @property {string} type - The type of the node (e.g., 'binary', 'assignment', 'literal', etc.).
 *  optionals
 * @property {string} [operator] - The operator (e.g., '+', '-', '*', '/', etc.).
 * @property {Node} [left] - The left node.
 * @property {Node} [right] - The right node.
 * @property {Node} [condition] - The expression node.
 * @property {Node} [consequent] - The consequent node.
 * @property {Node} [expression] - The expression node.
 * @property {Node} [alternate] - The alternate node.
 * @property {string} [target] - The target of the assignment.
 * @property {number} [value] - The value to be assigned.
 * @property {string} [name] - The name of functions and variables.
 * @property {string[]} [params] - The parameters of a function.
 * @property {Node[]} [body] - The body of a block statement.
*/

/**
 * Parse the list of tokens into an abstract syntax tree (AST).
 * @param {Token[]} tokens - The list of tokens to be parsed.
 * @returns {Node[]} An array of AST nodes.
 */

export function parseTokens(tokens) {
    let index = 0;

    const program = [];
    while (index < tokens.length) {
        let statement;
        let result = parseStatement(tokens, index);
        statement = result.statement;
        index = result.index; // Update the index
        program.push(statement);
    }

    return program;
}