// In: interpreter/executors/VariableExecutor.js

import { ErrorHandler } from "../ErrorHandler.js";
import { Environment } from "../environment.js";
import { BaseExecutor } from "./BaseExecutor.js";

export class VariableExecutor extends BaseExecutor {
  executeVariableDeclaration(node) {
    const value = this.interpreter.visitNode(node.value);

    switch (node.kind) {
      case "global":
        this.interpreter.globalEnv.define(node.identifier, value, 'global');
        break;

      case "let":
      case "const":
        this.interpreter.currentEnv.define(node.identifier, value, node.kind);
        break;

      default: // This handles 'set'
        const existingVarInfo = this.interpreter.currentEnv.getVariableInfo(node.identifier);
        
        if (existingVarInfo) {
            // Variable exists, so assign to it in its own environment.
            existingVarInfo.env.assign(node.identifier, value);
        } else {
            // Variable does not exist, so define it in the current scope.
            this.interpreter.currentEnv.define(node.identifier, value, 'set');
        }
        return value;
    }
    return value;
  }

  executePropertyAssignment(node) {
    const targetObject = this.interpreter.visitNode(node.object);
    const valueToAssign = this.interpreter.visitNode(node.value);

    if (targetObject === null || typeof targetObject !== 'object') {
        throw this.interpreter.errorHandler.createRuntimeError(
            `Cannot set property '${node.property}' on a non-object value (got ${typeof targetObject}).`,
            node.object, "TYPE004", "Ensure the target is an object before setting its properties."
        );
    }
    targetObject[node.property] = valueToAssign;
    return valueToAssign;
  }
  
  executeBracketAssignment(node) {
    const object = this.interpreter.visitNode(node.object);
    const index = this.interpreter.visitNode(node.index);
    const value = this.interpreter.visitNode(node.value);

    if (Array.isArray(object)) {
      if (typeof index !== "number" || !Number.isInteger(index)) {
        throw this.interpreter.errorHandler.createRuntimeError(`Array index for assignment must be an integer. Got '${typeof index}'.`, node.index, "TYPE001");
      }
      if (index < 0) {
        throw this.interpreter.errorHandler.createRuntimeError(`Array index cannot be negative. Got ${index}.`, node.index, "INDEX001");
      }
      object[index] = value;
      return value;
    }

    if (typeof object === "object" && object !== null) {
      const key = String(index);
      object[key] = value;
      return value;
    }

    throw this.interpreter.errorHandler.createRuntimeError(`Cannot set property on value of type '${typeof object}'.`, node.object, "TYPE002");
  }

  executeDestructuringAssignment(node) {
    const value = this.interpreter.visitNode(node.expression);
    const pattern = node.pattern; // The pattern node is now passed directly

    // Helper function to assign a value to a variable using 'set' semantics
    const assignOrDefine = (varNode, varValue) => {
        const varName = varNode.name;
        const existingVarInfo = this.interpreter.currentEnv.getVariableInfo(varName);
        if (existingVarInfo) {
            existingVarInfo.env.assign(varName, varValue);
        } else {
            this.interpreter.currentEnv.define(varName, varValue, 'set');
        }
    };

    // --- Main Logic ---

    if (pattern.type === 'ArrayPattern') {
      if (!Array.isArray(value)) {
        throw this.interpreter.errorHandler.createRuntimeError(`Cannot destructure non-array value into an array pattern.`, node.expression, 'TYPE002');
      }
      pattern.elements.forEach((varNode, i) => {
        assignOrDefine(varNode, value[i] ?? null); // Assign null if index is out of bounds
      });
    } else if (pattern.type === 'ObjectPattern') {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw this.interpreter.errorHandler.createRuntimeError(`Cannot destructure non-object value into an object pattern.`, node.expression, 'TYPE002');
      }
      pattern.properties.forEach(propIdentifierNode => {
        const propName = propIdentifierNode.name;
        // Assign the property's value, or null if it doesn't exist on the object
        assignOrDefine(propIdentifierNode, value[propName] ?? null);
      });
    } else {
        // This case should be unreachable if the parser is correct
        throw this.interpreter.errorHandler.createRuntimeError(`Unsupported pattern type '${pattern.type}' for destructuring.`, pattern, 'INT003');
    }

    return value; // The destructuring statement itself returns the original value
  }
}