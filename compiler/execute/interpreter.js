import { interpretBinary } from "./interpreters/binary";
import { interpretCall } from "./interpreters/call";
import { interpretIf } from "./interpreters/if";
import { interpretTryCatch } from "./interpreters/try-catch";
import { interpretWhile } from "./interpreters/while";
import { createFunction } from "./utils/createfunction";
import { evaluate } from "./utils/evaluate";

export async function interpretStatement(statement, env) {
  if (Array.isArray(statement)) {
    for (let i = 0; i < statement.length; i++) {
      if (await interpretStatement(statement[i], env)) return true;
    }
    return;
  }

  if (typeof statement === "object") {
    if (statement.type === "try-catch") {
      await interpretTryCatch(statement, env);
    } else {
      await interpretObjectStatement(statement, env);
    }
  }
}

async function interpretObjectStatement(statement, env) {
  switch (statement.type) {
    case "assignment":
      env[statement.target] = evaluate(statement.value, env);
      break;
    case "binary":
      await interpretBinary(statement, env);
      break;
    case "if":
      await interpretIf(statement, env);
      break;
    case "while":
      await interpretWhile(statement, env);
      break;
    case "function":
      env[statement.name] = createFunction(
        statement.params,
        statement.body,
        env
      );
      break;
    case "return":
      env["return"] = evaluate(statement.expression, env);
      return true;
    case "call":
      await interpretCall(statement, env);
      break;
    case "print":
      console.log(evaluate(statement.value, env));
      break;
    default:
      console.log("Unknown statement type", statement.type);
      break;
  }
}

export async function interpret(program, env = {}) {
  let index = 0;
  while (index < program.length) {
    if (await interpretStatement(program[index++], env)) break;
  }
  return env;
}
