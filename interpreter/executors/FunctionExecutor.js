import { BuiltinFunction } from "../BuiltinFunction.js";
import { stringify } from "../Utils.js";
import { FunctionValue, ReturnValue } from "../Values.js";
import { BaseExecutor } from "./BaseExecutor.js";

export class FunctionExecutor extends BaseExecutor {
  executeFunctionDeclaration(node) {
    const func = new FunctionValue(node, this.interpreter.currentEnv);
    this.interpreter.currentEnv.define(node.name, func);
    return null;
  }

  executeCallStatement(node) {
    // Evaluate the callee (could be identifier or module access)
    let func;
    let functionName;

    if (typeof node.callee === "string") {
      // Legacy support for string callee
      func = this.interpreter.currentEnv.lookup(node.callee);
      functionName = node.callee;
    } else {
      // New AST node callee (Identifier, ModuleAccess, or expression)
      func = this.interpreter.visitNode(node.callee);
      if (node.callee.type === "ModuleAccess") {
        functionName = `${node.callee.module}.${node.callee.property}`;
      } else if (node.callee.type === "Identifier") {
        functionName = node.callee.name;
      } else {
        functionName = "<anonymous function>";
      }
    }

    if (
      !(func instanceof FunctionValue) &&
      !(func instanceof BuiltinFunction)
    ) {
      throw this.interpreter.errorHandler.createRuntimeError(
        `'${functionName}' is not a callable function.`,
        node,
        "TYPE002",
        "Ensure you are calling a function or method."
      );
    }

    const args = [];
    for (const arg of node.arguments) {
      if (arg.type === 'SpreadElement') {
        const spreadValue = this.interpreter.visitNode(arg.argument);
        if (!Array.isArray(spreadValue)) {
          throw this.interpreter.errorHandler.createRuntimeError(
            `Cannot spread non-array value in function call.`,
            arg.argument,
            'TYPE001'
          );
        }
        args.push(...spreadValue);
      } else {
        args.push(this.interpreter.visitNode(arg));
      }
    }
    const result = func.call(this.interpreter, args, node); // Directly call, pass node for location

    if (node.destination) {
      this.interpreter.currentEnv.define(node.destination.name, result);
    }
    return result;
  }

  executeReturnStatement(node) {
    const value = node.argument
      ? this.interpreter.visitNode(node.argument)
      : null;
    return new ReturnValue(value);
  }

  executeShowStatement(node) {
    const value = this.interpreter.visitNode(node.expression);
    const rendered = stringify(value);
    if (this.interpreter.adapter && typeof this.interpreter.adapter.log === "function") {
      this.interpreter.adapter.log(rendered);
    } else {
      console.log(rendered);
    }
    return value;
  }

  executeThrowStatement(node) {
    const value = this.interpreter.visitNode(node.argument);
    throw this.interpreter.errorHandler.createRuntimeError(
      stringify(value),
      node,
      "USER001", // A code for user-thrown errors
      'This error was thrown by the "throw" statement.'
    );
  }
}
