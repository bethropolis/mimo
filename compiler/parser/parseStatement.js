import { parseExpression } from "./parseExpression";
import { ifStatement } from "./statement/if";
import { setStatement } from "./statement/set";
import { tryCatchStatement } from "./statement/try-catch";
import { whileStatement } from "./statement/while";
import { functionStatement } from "./statement/function";
import { callStatement } from "./statement/call";
import { returnStatement } from "./statement/return";
import { showStatement } from "./statement/show";

export const parseStatement = (tokens, index) => {
  let statement = { type: "statement" };

  // console.log("parsing..", tokens[index].type, tokens[index].value);
  if (tokens[index].value === "set") {
    ({ statement, index } = setStatement(tokens, index));
  } else if (tokens[index].value === "if") {
    ({ statement, index } = ifStatement(tokens, index));
  } else if (tokens[index].value === "while") {
    ({ statement, index } = whileStatement(tokens, index));
  } else if (tokens[index].value === "try") {
    ({ statement, index } = tryCatchStatement(tokens, index));
  } else if (tokens[index].value === "function") {
    ({ statement, index } = functionStatement(tokens, index));
  } else if (tokens[index].value === "call") {
    ({ statement, index } = callStatement(tokens, index));
  } else if (tokens[index].value === "return") {
    ({ statement, index } = returnStatement(tokens, index));
  } else if (tokens[index].value === "show") {
    ({ statement, index } = showStatement(tokens, index));
  } else {
    index++;
  }

  return { statement, index };
};
