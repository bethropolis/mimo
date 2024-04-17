import { parseExpression } from "../parseExpression.js";

export const callStatement = (tokens, index) => {
  let statement = { type: "call" };
  statement.name = tokens[index + 1]?.value;
  index += 2; // Skip 'call' and function name
  statement.args = [];
  statement.target = null;
  if (tokens[index].value === "(") {
    index++; // Skip '('
    while (tokens[index].value !== ")") {
      if (tokens[index].value !== ",") {
        let result = parseExpression(tokens, index);
        statement.args.push(result.expression);
        index = result.index; // Update the index
      } else {
        index++; // Skip ','
      }
    }
    index++; // Skip ')'
  }
  if ((tokens[index++].value = "->")) {
    statement.target = tokens[index++].value;
  }
  return { statement, index };
};
