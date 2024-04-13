import { evaluate } from "../utils/evaluate";

export async function interpretBinary(statement, env) {
    if (env[statement.target] === undefined) {
        env[statement.target] = null;
    }
    env[statement.target] = await operate(
        statement.operator,
        await evaluate(statement.left, env),
        await evaluate(statement.right, env)
    );
}