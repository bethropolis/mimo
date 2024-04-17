import { parseExpression } from "../parseExpression.js";

// #file:statement/return.js
export const returnStatement = (tokens, index) => {
    let statement = { type: "return" };
    let result = parseExpression(tokens, index + 1);
    statement.expression = result.expression;
    index = result.index; // Update the index
    return { statement, index };
};