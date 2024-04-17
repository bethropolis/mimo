import { parseExpression } from "../parseExpression.js";

export function setStatement(tokens, index) {
  let statement = { type: "assignment" };
  index++;
  statement.target = tokens[index++].value;
  let result = parseExpression(tokens, index);
  statement.value = result.expression;
  index = result.index; // Update the index
  return { statement, index };
}
