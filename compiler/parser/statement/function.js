import { parseStatement } from "../parseStatement.js";

// #file:statement/function.js
export const functionStatement = (tokens, index) => {
  index++; // Skip 'function'
  let statement = { type: "function" };
  statement.name = tokens[index++]?.value;
  index++; // Skip 'function' and function name
  statement.params = [];
  while (tokens[index]?.value !== ")") {
    statement.params.push(tokens[index]?.value);
    index++; // Skip parameter
    if (tokens[index]?.value === ",") {
      index++; // Skip ','
    }
  }
  index++; // Skip ')'
  const body = [];
  while (tokens[index] && tokens[index].value !== "endfunction") {
    let result = parseStatement(tokens, index);
    body.push(result.statement);
    index = result.index; // Update the index
  }
  if (tokens[index].value === "endfunction") {
    index++;
  }
  statement.body = body;
  return { statement, index };
};
