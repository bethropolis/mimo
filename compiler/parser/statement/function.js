import { parseStatement } from "../parseStatement";

// #file:statement/function.js
export const functionStatement = (tokens, index) => {
  let statement = { type: "function" };
  statement.name = tokens[index + 1]?.value;
  index += 2; // Skip 'function' and function name
  const parameters = [];
  while (tokens[index]?.value !== ")") {
    parameters.push(tokens[index]?.value);
    index++; // Skip parameter
    if (tokens[index]?.value === ",") {
      index++; // Skip ','
    }
  }
  index++; // Skip ')'
  statement.parameters = parameters;
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
