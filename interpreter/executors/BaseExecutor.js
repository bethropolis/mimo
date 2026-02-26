import { ErrorHandler } from "../ErrorHandler.js";
import { ReturnValue } from "../Values.js";

export class BaseExecutor {
  constructor(interpreter) {
    this.interpreter = interpreter;
  }

  // Helper function to find the nearest function scope or global scope
  findFunctionScope(env) {
    let currentEnv = env;
    while (currentEnv && !currentEnv.isGlobalScope) {
      if (currentEnv.vars.size > 0) {
        return currentEnv;
      }
      currentEnv = currentEnv.parent;
    }
    return currentEnv || this.interpreter.globalEnv;
  }

  // Helper: treat any environment that is the closure for a function as a function scope
  isFunctionScope(env) {
    return env.isFunctionContext; // Now correctly identifies function scopes
  }

  executeProgram(node) {
    this.interpreter.hoistFunctionDeclarations(node.body);
    let result = null;
    for (const statement of node.body) {
      result = this.interpreter.visitNode(statement);
      if (result instanceof ReturnValue) {
        return result.value;
      }
    }
    return result;
  }
}
