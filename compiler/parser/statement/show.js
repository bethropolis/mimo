import { parseExpression } from "../parseExpression";

export const showStatement = (tokens, index) => {
    let statement = { type: "print" };
    index++; // Skip 'show'
    let result = parseExpression(tokens, index);
    statement.value = result.expression;
    index = result.index; // Update the index
    return { statement, index };
};