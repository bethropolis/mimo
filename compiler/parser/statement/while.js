import { parseExpression } from "../parseExpression";
import { parseStatement } from "../parseStatement";


export const whileStatement = (tokens, index) => {
  let statement = { type: "while" };
  let result = parseExpression(tokens, index);
  statement.condition = result.expression;
  index = result.index; // Update the index
  const body = [];
  while (tokens[index] && tokens[index].value !== "endwhile") {
    let result = parseStatement(tokens, index);
    body.push(result.statement);
    index = result.index; // Update the index
  }
  if (tokens[index].value === "endwhile") {
    index++;
  }
  statement.body = body;
  return { statement, index };
};