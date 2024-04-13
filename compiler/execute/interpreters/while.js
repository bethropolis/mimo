import { interpretStatement } from "../interpreter";
import { evaluate } from "../utils/evaluate";

export async function interpretWhile(statement, env) {
    while (evaluate(statement.condition, env)) {
        if (await interpretStatement(statement.body, env)) return true;
    }
}
