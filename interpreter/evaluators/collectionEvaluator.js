// In interpreter/evaluators/collectionEvaluator.js
import { suggestNearestName } from "../suggestions.js";

export function evaluateArrayLiteral(interpreter, node) {
  const result = [];
  for (const element of node.elements) {
    if (element.type === "SpreadElement") {
      const spreadValue = interpreter.visitNode(element.argument);
      if (!Array.isArray(spreadValue)) {
        throw interpreter.errorHandler.createRuntimeError(
          `Cannot spread non-array value of type '${typeof spreadValue}'.`,
          element,
          "TYPE001",
          'Spread operator "..." can only be used with arrays.'
        );
      }
      result.push(...spreadValue);
    } else {
      result.push(interpreter.visitNode(element));
    }
  }
  return result;
}

export function evaluateArrayAccess(interpreter, node) {
  const object = interpreter.visitNode(node.object);
  const index = interpreter.visitNode(node.index); // This is the key or the index

  // Case 1: The target is an Array
  if (Array.isArray(object)) {
    if (typeof index !== 'number' || !Number.isInteger(index)) {
      throw interpreter.errorHandler.createRuntimeError(
        `Array index must be an integer. Got type '${typeof index}'.`,
        node.index, 'TYPE001', "Provide an integer for array indexing."
      );
    }
    return (index < 0 || index >= object.length) ? null : object[index];
  }

  // Case 2: The target is an Object
  if (typeof object === 'object' && object !== null) {
    const key = String(index);
    return Object.prototype.hasOwnProperty.call(object, key) ? object[key] : null;
  }

  // Case 3: The target is a String
  if (typeof object === 'string') {
    if (typeof index !== 'number' || !Number.isInteger(index)) {
      throw interpreter.errorHandler.createRuntimeError(
        `String index must be an integer. Got type '${typeof index}'.`,
        node.index, 'TYPE001', "Provide an integer for string character access."
      );
    }
    return (index < 0 || index >= object.length) ? null : object.charAt(index);
  }

  // If none of the above, it's an error
  throw interpreter.errorHandler.createRuntimeError(
    `Cannot access property on value of type '${typeof object}'. Only arrays, objects, and strings can be indexed.`,
    node.object, 'TYPE002', "Ensure you are using bracket notation on a valid collection type."
  );
}

export function evaluateObjectLiteral(interpreter, node) {
  const obj = {};
  for (const prop of node.properties) {
    if (prop && prop.type === "SpreadElement") {
      const spreadValue = interpreter.visitNode(prop.argument);
      if (typeof spreadValue !== 'object' || spreadValue === null || Array.isArray(spreadValue)) {
        throw interpreter.errorHandler.createRuntimeError(
          `Cannot spread non-object value of type '${typeof spreadValue}'.`,
          prop.argument,
          "TYPE001",
          'Object spread operator "..." can only be used with objects.'
        );
      }
      Object.assign(obj, spreadValue);
    } else {
      const value = interpreter.visitNode(prop.value);
      obj[prop.key] = value;
    }
  }
  return obj;
}

export function evaluatePropertyAccess(interpreter, node) {
  const object = interpreter.visitNode(node.object);

  if (object === null || object === undefined) {
    throw interpreter.errorHandler.createRuntimeError(
      `Cannot access property '${node.property}' of 'null'.`,
      node.object, // AST node for the object being accessed
      "REF001",
      "Ensure the object is not null or undefined before accessing its properties. Consider using safe navigation (?. )."
    );
  }

  // Allow property access on strings (e.g., `my_string.length`)
  if (typeof object !== "object" && typeof object !== "string") {
    throw interpreter.errorHandler.createRuntimeError(
      `Cannot access property '${node.property
      }' of non-object value of type '${typeof object}'.`,
      node.object,
      "TYPE002",
      "Properties can only be accessed on objects or strings."
    );
  }

  if (!(node.property in object)) {
    const candidates = typeof object === "object" && object !== null
      ? Object.keys(object)
      : Object.getOwnPropertyNames(object);
    const nearest = suggestNearestName(node.property, candidates);
    const suggestion = nearest
      ? `Did you mean '${nearest}'?`
      : "Check for typos or ensure the property exists.";
    throw interpreter.errorHandler.createRuntimeError(
      `Property '${node.property}' does not exist on ${Array.isArray(object) ? "array" : typeof object}.`,
      node,
      "PROP001",
      suggestion
    );
  }

  return object[node.property];
}

export function evaluateSafePropertyAccess(interpreter, node) {
  const object = interpreter.visitNode(node.object);

  if (object === null || object === undefined) {
    return null;
  }

  // If property doesn't exist, return null instead of letting evaluatePropertyAccess throw
  if (!(node.property in object)) {
    return null;
  }

  return evaluatePropertyAccess(interpreter, { ...node, type: 'PropertyAccess' });
}

export function evaluateSafeArrayAccess(interpreter, node) {
  const object = interpreter.visitNode(node.object);

  if (object === null || object === undefined) {
    return null;
  }

  return evaluateArrayAccess(interpreter, { ...node, type: 'ArrayAccess' });
}
