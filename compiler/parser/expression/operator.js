import { parseExpression } from "../parseExpression";

export function operatorExpression(tokens, index) {
  let operator = tokens[index++].value;
  let left = parseExpression(tokens, index);
  index = left.index; // Update the index
  if (tokens[index]?.type === "operator") {
    operator += tokens[index++].value; // Handle two-character operators like '=='
  }
  let right = parseExpression(tokens, index);
  index = right.index; // Update the index
  return {
    expression: {
      type: "binary",
      operator,
      left: left.expression,
      right: right.expression,
    },
    index,
  };
}
