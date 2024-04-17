import { evaluate } from "../utils/evaluate.js";

export async function interpretCall(statement, env) {
    const func = env[statement.name];
    if (typeof func !== "function") {
        throw new Error(`${statement.name} is not a function`);
    }
    const args = statement.args.map((arg) => evaluate(arg, env));
    env[statement.target] = await func(...args);
}
