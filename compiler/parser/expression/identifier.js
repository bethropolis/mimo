import { parseExpression } from "../parseExpression.js";

export function identifierExpression(tokens, index) {
  if (
    tokens[index + 1]?.value === "[" &&
    tokens[index + 3]?.value === "]"
  ) {
    const name = tokens[index].value;
    index += 2; // Skip identifier and '['
    const indexExpression = parseExpression(tokens, index);
    index = indexExpression.index; // Update the index
    if (tokens[index]?.value === "]") {
      index++; // Skip ']'
    }
    return {
      expression: {
        type: "indexAccess",
        name,
        index: indexExpression.expression,
      },
      index,
    };
  } else {
    return {
      expression: { type: "variable", name: tokens[index++].value },
      index,
    };
  }
}
