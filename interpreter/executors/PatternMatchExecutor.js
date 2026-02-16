import { ErrorHandler } from "../ErrorHandler.js";
import { Environment } from "../environment.js";
import { stringify, isTruthy } from "../Utils.js";
import { BaseExecutor } from "./BaseExecutor.js";

export class PatternMatchExecutor extends BaseExecutor {
  executeMatchStatement(node) {
    const discriminant = this.interpreter.visitNode(node.discriminant);

    for (const caseClause of node.cases) {
      const bindings = {};
      // The `matchesPattern` method might throw if a pattern is invalid, let it bubble up.
      if (this.matchesPattern(discriminant, caseClause.pattern, bindings)) {
        // Create new block scope for case body
        const caseEnv = new Environment(this.interpreter.currentEnv);

        // Bind all captured variables to the case scope
        for (const [name, value] of Object.entries(bindings)) {
          // Define the variable in the case's scope
          // Default to 'let' kind for bindings, but could be configurable
          caseEnv.define(name, value, "let"); // Assume 'let' kind for pattern bindings
        }

        return this.interpreter.executeBlock(caseClause.consequent, caseEnv);
      }
    }

    // No match found and no default case
    throw this.interpreter.errorHandler.createRuntimeError(
      `No matching pattern found for value: ${stringify(discriminant)}`,
      node.discriminant, // Point to the discriminant expression
      "MATCH001",
      `Add an 'default:' clause or ensure all possible values are covered by 'case' clauses.`
    );
  }

  matchesPattern(value, pattern, bindings = {}) {
    // Default case (pattern is null)
    if (pattern === null) {
      return true;
    }

    switch (pattern.type) {
      case "Literal":
        return value === pattern.value;

      case "Identifier":
        // Identifier patterns always match and bind the value
        bindings[pattern.name] = value;
        return true;

      case "ArrayPattern":
        if (!Array.isArray(value)) {
          return false;
        }

        // Check if array length matches
        if (value.length !== pattern.elements.length) {
          return false;
        }

        // Check each element and collect bindings
        for (let i = 0; i < pattern.elements.length; i++) {
          if (!this.matchesPattern(value[i], pattern.elements[i], bindings)) {
            return false;
          }
        }
        return true;

      // TODO: Add ObjectPattern, TypePattern etc.
      default:
        throw this.interpreter.errorHandler.createRuntimeError(
          `Internal error: Unknown pattern type '${pattern.type}' encountered during matching.`,
          pattern, // The AST node for the problematic pattern
          "INT003",
          "This indicates a bug in the Mimo interpreter. Please report this error."
        );
    }
  }
}
