import { parseExpression } from "../parseExpression.js";

export function punctuationExpression(tokens, index) {
    if (tokens[index].value === "[") {
        index++; // Skip '['
        const elements = [];
        while (
          tokens[index]?.type !== "punctuation" &&
          tokens[index]?.value !== "]"
        ) {
          let result = parseExpression(tokens, index);
          elements.push(result.expression);
          index = result.index; // Update the index
          if (
            tokens[index]?.type === "punctuation" &&
            tokens[index]?.value === ","
          ) {
            index++; // Skip ',' between elements
          }
        }
        if (tokens[index]?.value === "]") {
          index++; // Skip ']'
        }
        return { expression: { type: "list", elements }, index };
      }

    return {
        expression: { type: "punctuation", value: tokens[index++].value },
        index,
    };
}
