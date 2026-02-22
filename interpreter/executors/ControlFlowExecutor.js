import { ErrorHandler } from "../ErrorHandler.js";
import { Environment } from "../environment.js";
import { isTruthy, stringify } from "../Utils.js";
import { BreakException, ContinueException, ReturnValue } from "../Values.js";
import { BaseExecutor } from "./BaseExecutor.js";
import { MimoError } from "../MimoError.js";

export class ControlFlowExecutor extends BaseExecutor {
  executeIfStatement(node) {
    const condition = this.interpreter.visitNode(node.condition);

    if (isTruthy(condition)) {
      // Create new block scope for consequent
      const blockEnv = new Environment(this.interpreter.currentEnv);
      return this.interpreter.executeBlock(node.consequent, blockEnv);
    }

    if (node.alternate) {
      if (node.alternate.type === "IfStatement") {
        return this.interpreter.visitNode(node.alternate);
      } else {
        const blockEnv = new Environment(this.interpreter.currentEnv);
        return this.interpreter.executeBlock(node.alternate, blockEnv);
      }
    }

    return null;
  }

  executeGuardStatement(node) {
    const condition = this.interpreter.visitNode(node.condition);

    // If the condition is met, do nothing (continue execution sequentially)
    if (isTruthy(condition)) {
      return null;
    }

    // Execute the alternate (else) block
    const blockEnv = new Environment(this.interpreter.currentEnv);
    const result = this.interpreter.executeBlock(node.alternate, blockEnv);

    // Check if the else block terminated execution correctly
    // It should either return a ReturnValue, or throw a BreakException/ContinueException/MimoError.
    // If it reaches this point without doing so, it means the guard block didn't properly exit or the result wasn't a return.
    if (!(result instanceof ReturnValue)) {
      throw this.interpreter.errorHandler.createRuntimeError(
        `A guard statement's 'else' block must terminate execution (e.g., via return, throw, break, or continue).`,
        node.alternate[node.alternate.length - 1] || node, // point to last statement or guard itself
        "CTRL001",
        "Add a return, throw, break, or continue statement to the end of the guard's else block."
      );
    }

    return result; // returning the ReturnValue effectively terminates the current block
  }

  executeWhileStatement(node) {
    let result = null;
    while (isTruthy(this.interpreter.visitNode(node.condition))) {
      try {
        // Create new block scope for each iteration
        const blockEnv = new Environment(this.interpreter.currentEnv);
        result = this.interpreter.executeBlock(node.body, blockEnv);
        if (result instanceof ReturnValue) {
          return result;
        }
      } catch (exception) {
        if (exception instanceof BreakException) {
          if (exception.label && exception.label !== node.label) throw exception;
          break;
        }
        if (exception instanceof ContinueException) {
          if (exception.label && exception.label !== node.label) throw exception;
          continue;
        }
        throw exception;
      }
    }
    return result;
  }

  executeForStatement(node) {
    const iterable = this.interpreter.visitNode(node.iterable);
    if (!Array.isArray(iterable)) {
      throw this.interpreter.errorHandler.createRuntimeError(
        `For loop requires an iterable (array). Got '${typeof iterable}'.`,
        node.iterable,
        "TYPE001",
        'Ensure the expression after "in" is an array.',
        this.interpreter.callStack
      );
    }

    const previousEnv = this.interpreter.currentEnv;
    this.interpreter.currentEnv = new Environment(previousEnv);

    let result = null;
    try {
      for (const item of iterable) {
        try {
          // Create a new block scope for each iteration
          const iterationEnv = new Environment(this.interpreter.currentEnv);
          iterationEnv.define(node.variable.name, item);
          result = this.interpreter.executeBlock(node.body, iterationEnv);
          if (result instanceof ReturnValue) {
            return result;
          }
        } catch (exception) {
          if (exception instanceof BreakException) {
            if (exception.label && exception.label !== node.label) throw exception;
            break;
          }
          if (exception instanceof ContinueException) {
            if (exception.label && exception.label !== node.label) throw exception;
            continue;
          }
          throw exception;
        }
      }
    } finally {
      this.interpreter.currentEnv = previousEnv;
    }
    return result;
  }

  executeLoopStatement(node) {
    let result = null;
    while (true) {
      try {
        // Create new block scope for each iteration
        const blockEnv = new Environment(this.interpreter.currentEnv);
        result = this.interpreter.executeBlock(node.body, blockEnv);
        if (result instanceof ReturnValue) {
          return result;
        }
      } catch (exception) {
        if (exception instanceof BreakException) {
          if (exception.label && exception.label !== node.label) throw exception;
          break;
        }
        if (exception instanceof ContinueException) {
          if (exception.label && exception.label !== node.label) throw exception;
          continue;
        }
        throw exception;
      }
    }
    return result;
  }

  executeBreakStatement(node) {
    throw new BreakException(node.label);
  }

  executeContinueStatement(node) {
    throw new ContinueException(node.label);
  }

  executeTryStatement(node) {
    try {
      // Create new block scope for try block
      const tryEnv = new Environment(this.interpreter.currentEnv);
      return this.interpreter.executeBlock(node.tryBlock, tryEnv);
    } catch (error) {
      // Catch the actual MimoError or JS Error
      if (node.catchVar && node.catchBlock) {
        // Create new block scope for catch block
        const catchEnv = new Environment(this.interpreter.currentEnv);
        // The caught error can be a MimoError or a raw JS Error
        // We pass the MimoError object or a simplified string representation
        // All errors caught by the try block (from Mimo code) should already be MimoErrors.
        // If a raw JS error somehow propagates (which should be rare with Interpreter.interpret's wrapping),
        // wrap it here too for consistency in the catch block.
        const errorValue =
          error instanceof MimoError
            ? error
            : this.interpreter.errorHandler.createRuntimeError(
              `Unhandled JavaScript error: ${error.message}`,
              node, // Use the try statement node for location if a raw JS error occurs
              "INT005",
              "An unexpected error occurred during execution. This indicates a bug in the Mimo interpreter, or an unhandled case. Please report this error."
            );
        catchEnv.define(node.catchVar.name, errorValue);
        return this.interpreter.executeBlock(node.catchBlock, catchEnv);
      }
      // If no catch block, re-throw the error
      throw error;
    }
  }

  executeLabeledStatement(node) {
    if (node.statement) {
      node.statement.label = node.label;
      return this.interpreter.statementExecutor.executeStatement(node.statement);
    }
    return null;
  }
}
