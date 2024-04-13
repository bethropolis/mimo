const operations = new Map([
  ["+", (left, right) => left + right],
  ["-", (left, right) => left - right],
  ["*", (left, right) => left * right],
  ["/", (left, right) => left / right],
  ["%", (left, right) => left % right],
  ["**", (left, right) => left ** right],
  [">", (left, right) => left > right],
  ["<", (left, right) => left < right],
  [">=", (left, right) => left >= right],
  ["<=", (left, right) => left <= right],
  ["==", (left, right) => left == right],
  ["!=", (left, right) => left != right],
  ["!", (left) => !left],
]);

export const operate = (operator, left, right) => {
  const operation = operations.get(operator);
  if (!operation) {
    throw new Error(`Invalid operator: ${operator}`);
  }
  return operation(left, right);
};
