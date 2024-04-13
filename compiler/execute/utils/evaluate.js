import { operate } from "./operate";

export const evaluate = (expression, env) =>
  expression.type === "literal"
    ? expression.value
    : expression.type === "variable"
    ? env.hasOwnProperty(expression.name)
      ? env[expression.name]
      : null
    : expression.type === "list"
    ? expression.elements.map((element) => evaluate(element, env))
    : expression.type === "indexAccess"
    ? env[expression.name][evaluate(expression.index, env)]
    : expression.type === "binary"
    ? operate(
        expression.operator,
        evaluate(expression.left, env),
        evaluate(expression.right, env)
      )
    : null;
