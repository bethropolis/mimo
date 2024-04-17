import { parseStatement } from "../parseStatement.js";

export const tryCatchStatement = (tokens, index) => {
  let statement = { type: "try-catch" };
  statement.tryBlock = [];
  index++;
  while (tokens[index] && tokens[index].value !== "catch") {
    let result = parseStatement(tokens, index);
    statement.tryBlock.push(result.statement);
    index = result.index; // Update the index
  }
  if (tokens[index].value === "catch") {
    index++;
    statement.catchBlock = [];
    while (tokens[index] && tokens[index].value !== "endtry") {
      let result = parseStatement(tokens, index);
      statement.catchBlock.push(result.statement);
      index = result.index; // Update the index
    }
  }
  if (tokens[index].value === "endtry") {
    index++;
  }
  return { statement, index };
};
