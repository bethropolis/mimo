export const parseExpression = (tokens, index) => {
//   console.log("expression..", tokens[index].type, tokens[index].value);

  switch (tokens[index].type) {
    case "number":
      return {
        expression: {
          type: "literal",
          value: parseFloat(tokens[index++].value),
        },
        index,
      };
    case "string":
      return {
        expression: { type: "literal", value: tokens[index++].value },
        index,
      };
    case "identifier":
      if (
        tokens[index + 1]?.value === "[" &&
        tokens[index + 3]?.value === "]"
      ) {
        const name = tokens[index].value;
        index += 2; // Skip identifier and '['
        const indexExpression = parseExpression(tokens, index);
        index = indexExpression.index; // Update the index
        if (tokens[index]?.value === "]") {
          index++; // Skip ']'
        }
        return {
          expression: {
            type: "indexAccess",
            name,
            index: indexExpression.expression,
          },
          index,
        };
      } else {
        return {
          expression: { type: "variable", name: tokens[index++].value },
          index,
        };
      }
    case "operator":
      let operator = tokens[index++].value;
      let left = parseExpression(tokens, index);
      index = left.index; // Update the index
      if (tokens[index]?.type === "operator") {
        operator += tokens[index++].value; // Handle two-character operators like '=='
      }
      let right = parseExpression(tokens, index);
      index = right.index; // Update the index
      return {
        expression: {
          type: "binary",
          operator,
          left: left.expression,
          right: right.expression,
        },
        index,
      };
    case "punctuation":
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
      break;
    default:
      if (["<", ">", ">=", "<=", "==", "!="].includes(tokens[index].value)) {
        const operator = tokens[index++].value;
        let left = parseExpression(tokens, index);
        index = left.index; // Update the index
        let right = parseExpression(tokens, index);
        index = right.index; // Update the index
        return {
          expression: {
            type: "comparison",
            operator,
            left: left.expression,
            right: right.expression,
          },
          index,
        };
      }
  }
};
