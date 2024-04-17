import { ifStatement } from "./statement/if.js";
import { setStatement } from "./statement/set.js";
import { tryCatchStatement } from "./statement/try-catch.js";
import { whileStatement } from "./statement/while";
import { functionStatement } from "./statement/function.js";
import { callStatement } from "./statement/call.js";
import { returnStatement } from "./statement/return.js";
import { showStatement } from "./statement/show.js";

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
