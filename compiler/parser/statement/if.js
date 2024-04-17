import { parseExpression } from "../parseExpression.js";
import { parseStatement } from "../parseStatement.js";

export function ifStatement(tokens, index) {
  let statement = { type: "if" };
  index++;
  let result = parseExpression(tokens, index);
  statement.condition = result.expression;
  index = result.index; // Update the index
  statement.consequent = [];

  while (
      tokens[index] &&
      tokens[index].value !== "endif" &&
      tokens[index].value !== "else"
  ) {
      let result = parseStatement(tokens, index);
      statement.consequent.push(result.statement);
      index = result.index; // Update the index
  }
  if (tokens[index].value === "else") {
      index++;
      statement.alternate = [];
      while (tokens[index] && tokens[index].value !== "endif") {
          let result = parseStatement(tokens, index);
          statement.alternate.push(result.statement);
          index = result.index; // Update the index
      }
  }
  if (tokens[index].value === "endif") {
      index++;
  }
  return { statement, index };
}
