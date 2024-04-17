import { comparisonExpression } from "./expression/comparison.js";
import { identifierExpression } from "./expression/identifier.js";
import { numberExpression } from "./expression/number.js";
import { operatorExpression } from "./expression/operator.js";
import { punctuationExpression } from "./expression/punctuation.js";
import { stringExpression } from "./expression/string.js";

export const parseExpression = (tokens, index) => {
//   console.log("expression..", tokens[index].type, tokens[index].value);

  switch (tokens[index].type) {
    case "number":
     return numberExpression(tokens, index);
    case "string":
      return stringExpression(tokens, index);
    case "identifier":
      return identifierExpression(tokens, index);
    case "operator":
     return operatorExpression(tokens, index);
    case "punctuation":
      return punctuationExpression(tokens, index);
    default:
      if (["<", ">", ">=", "<=", "==", "!="].includes(tokens[index].value)) {
        return comparisonExpression(tokens, index);
      }
  }
};
