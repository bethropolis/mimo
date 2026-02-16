export class Environment {
  constructor(parent = null, isGlobalScope = false, isFunctionContext = false) {
    // <--- Add isFunctionContext
    this.vars = new Map(); // name -> { value, kind, mutable }
    this.parent = parent;
    this.isGlobalScope = isGlobalScope;
    this.isFunctionContext = isFunctionContext;
    this.isModuleRoot = false;
  }

  define(name, value, kind = "set") {
    // Check if variable already exists in current scope only
    if (this.vars.has(name)) {
      const existing = this.vars.get(name);
      // Allow redeclaring 'set' variables in same scope, but not let/const
      if (kind !== "set" || existing.kind !== "set") {
        throw new Error(`Variable '${name}' is already declared in this scope`);
      }
    }

    const mutable = kind !== "const";
    this.vars.set(name, { value, kind, mutable });
  }

  defineGlobal(name, value, kind = "set") {
    // Find global environment
    let globalEnv = this;
    while (globalEnv.parent !== null) {
      globalEnv = globalEnv.parent;
    }
    globalEnv.define(name, value, kind);
  }

  assign(name, value) {
    // Look for variable in current scope first
    if (this.vars.has(name)) {
      const variable = this.vars.get(name);
      if (!variable.mutable) {
        throw new Error(`Cannot assign to const variable '${name}'`);
      }
      variable.value = value;
      return;
    }

    // Look in parent scopes
    if (this.parent) {
      this.parent.assign(name, value);
      return;
    }

    throw new Error(`Undefined variable: ${name}`);
  }

  lookup(name) {
    if (this.vars.has(name)) {
      return this.vars.get(name).value;
    }
    if (this.parent) {
      return this.parent.lookup(name);
    }
    throw new Error(`Undefined variable: ${name}`);
  }

  hasInCurrentScope(name) {
    return this.vars.has(name);
  }

  getVariableInfo(name) {
    // If found in current environment, return info and *this* environment
    if (this.vars.has(name)) {
      return { info: this.vars.get(name), env: this };
    }

    if (this.isModuleRoot || this.isGlobalScope) {
      return null;
    }

    // If not found here, check parent.
    if (this.parent) {
      // The recursive call will correctly traverse up and return the { info, env } object
      // from the environment where the variable was found. Just return that result directly.
      return this.parent.getVariableInfo(name);
    }
    // If no parent and not found, return null.
    return null;
  }
}
