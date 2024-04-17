import { interpretStatement } from "../interpreter.js";
import { evaluate } from "../utils/evaluate.js";

export async function interpretWhile(statement, env) {
    while (evaluate(statement.condition, env)) {
        if (await interpretStatement(statement.body, env)) return true;
    }
}
