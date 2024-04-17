import { interpret } from "../interpreter.js";

export function createFunction(params, body, env) {
  return async function (...args) {
    const newEnv = { ...env };
    params.forEach((param, index) => {
      newEnv[param] = args[index] ?? undefined;
    });
    return (await interpret(body, newEnv))["return"];
  };
}
