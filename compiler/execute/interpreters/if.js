import { interpretStatement } from "../interpreter";
import { evaluate } from "../utils/evaluate";

export async function interpretIf(statement, env) {
    if (evaluate(statement.condition, env)) {
        if (await interpretStatement(statement.consequent, env)) return true;
    } else if (statement.alternate) {
        if (await interpretStatement(statement.alternate, env)) return true;
    }
}
