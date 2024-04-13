
export async function interpretTryCatch(statement, env) {
    try {
        await interpretStatement(statement.tryBlock, env);
    } catch (error) {
        env[statement.error] = error;
        await interpretStatement(statement.catchBlock, env);
    }
}