export class BuiltinFunction {
  constructor(name, implementation, arity) {
    this.name = name;
    this.implementation = implementation;
    this.arity = arity;
  }

  call(interpreter, args, callNode) { // Add callNode parameter
    // Handle variable arity functions (arity can be an array [min, max])
    if (Array.isArray(this.arity)) {
      const [min, max] = this.arity;
      if (args.length < min || args.length > max) {
        throw interpreter.errorHandler.createRuntimeError(
          `Built-in function '${this.name}' expects ${min}-${max} arguments but received ${args.length}.`,
          callNode,
          'BUILTIN001',
          `Check the arguments provided to built-in function '${this.name}'.`
        );
      }
    } else {
      if (args.length !== this.arity) {
        throw interpreter.errorHandler.createRuntimeError(
          `Built-in function '${this.name}' expects ${this.arity} arguments but received ${args.length}.`,
          callNode,
          'BUILTIN001',
          `Check the arguments provided to built-in function '${this.name}'.`
        );
      }
    }
    return this.implementation(args, interpreter, callNode); // Pass callNode to implementation
  }
}