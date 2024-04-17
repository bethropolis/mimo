import { parseExpression } from "../parseExpression.js";

export function comparisonExpression(tokens, index) {
    const operator = tokens[index++].value;
        let left = parseExpression(tokens, index);
        index = left.index; // Update the index
        let right = parseExpression(tokens, index);
        index = right.index; // Update the index
        return {
          expression: {
            type: "comparison",
            operator,
            left: left.expression,
            right: right.expression,
          },
          index,
        };
}