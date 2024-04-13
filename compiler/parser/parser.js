import { parseStatement } from "./parseStatement";

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