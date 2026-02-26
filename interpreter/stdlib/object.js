import { BuiltinFunction } from '../BuiltinFunction.js';
import { FunctionValue } from '../Values.js';

function expectObject(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (typeof arg !== 'object' || arg === null || Array.isArray(arg)) {
    throw interpreter.errorHandler.createRuntimeError(
      `${funcName}() expects an object as argument ${argPosition}. Got '${Array.isArray(arg) ? 'array' : typeof arg}'.`,
      callNode,
      'TYPE001',
      `Provide a plain object for argument ${argPosition} of ${funcName}().`
    );
  }
}

function expectArray(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (!Array.isArray(arg)) {
    throw interpreter.errorHandler.createRuntimeError(
      `${funcName}() expects an array as argument ${argPosition}. Got '${typeof arg}'.`,
      callNode,
      'TYPE001',
      `Provide an array for argument ${argPosition} of ${funcName}().`
    );
  }
}

function expectFunction(arg, funcName, interpreter, callNode, argPosition = 1) {
  if (!(arg instanceof FunctionValue)) {
    throw interpreter.errorHandler.createRuntimeError(
      `${funcName}() expects a function as argument ${argPosition}. Got '${typeof arg}'.`,
      callNode,
      'TYPE001',
      `Provide a function for argument ${argPosition} of ${funcName}().`
    );
  }
}

const objectMerge = new BuiltinFunction('merge', (args, interpreter, callNode) => {
  if (args.length === 0) return {};
  const result = {};
  args.forEach((obj, index) => {
    expectObject(obj, 'merge', interpreter, callNode, index + 1);
    Object.assign(result, obj);
  });
  return result;
}, [0, Infinity]);

const objectPick = new BuiltinFunction('pick', (args, interpreter, callNode) => {
  const [obj, keys] = args;
  expectObject(obj, 'pick', interpreter, callNode, 1);
  expectArray(keys, 'pick', interpreter, callNode, 2);

  const result = {};
  keys.forEach((key, index) => {
    if (typeof key !== 'string') {
      throw interpreter.errorHandler.createRuntimeError(
        `pick() expects key list to contain strings. Got '${typeof key}' at index ${index}.`,
        callNode,
        'TYPE001'
      );
    }
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  });
  return result;
}, 2);

const objectOmit = new BuiltinFunction('omit', (args, interpreter, callNode) => {
  const [obj, keys] = args;
  expectObject(obj, 'omit', interpreter, callNode, 1);
  expectArray(keys, 'omit', interpreter, callNode, 2);

  const excluded = new Set();
  keys.forEach((key, index) => {
    if (typeof key !== 'string') {
      throw interpreter.errorHandler.createRuntimeError(
        `omit() expects key list to contain strings. Got '${typeof key}' at index ${index}.`,
        callNode,
        'TYPE001'
      );
    }
    excluded.add(key);
  });

  const result = {};
  Object.keys(obj).forEach((key) => {
    if (!excluded.has(key)) {
      result[key] = obj[key];
    }
  });

  return result;
}, 2);

const objectMapValues = new BuiltinFunction('map_values', (args, interpreter, callNode) => {
  const [obj, callback] = args;
  expectObject(obj, 'map_values', interpreter, callNode, 1);
  expectFunction(callback, 'map_values', interpreter, callNode, 2);

  const result = {};
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const callArgs = [obj[key], key, obj].slice(0, callback.declaration.params.length);
    result[key] = callback.call(interpreter, callArgs, callNode);
  }
  return result;
}, 2);

const objectFromEntries = new BuiltinFunction('from_entries', (args, interpreter, callNode) => {
  const [entries] = args;
  expectArray(entries, 'from_entries', interpreter, callNode, 1);

  const result = {};
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!Array.isArray(entry) || entry.length < 2) {
      throw interpreter.errorHandler.createRuntimeError(
        `from_entries() expects each item to be an array [key, value]. Invalid entry at index ${i}.`,
        callNode,
        'TYPE001'
      );
    }
    result[String(entry[0])] = entry[1];
  }
  return result;
}, 1);

const objectIsEmpty = new BuiltinFunction('is_empty', (args, interpreter, callNode) => {
  const [obj] = args;
  expectObject(obj, 'is_empty', interpreter, callNode, 1);
  return Object.keys(obj).length === 0;
}, 1);

export const objectModule = {
  merge: objectMerge,
  pick: objectPick,
  omit: objectOmit,
  map_values: objectMapValues,
  from_entries: objectFromEntries,
  is_empty: objectIsEmpty,
};
