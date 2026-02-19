import { Lexer } from "../lexer/Lexer.js";
import { ASTNode } from "../parser/ASTNodes.js";
import { Parser } from "../parser/Parser.js";
import { ErrorHandler } from "./ErrorHandler.js";
import { Environment } from "./environment.js";
import { MimoError } from "./MimoError.js";
import { arrayModule } from "./stdlib/array.js";
import { assertModule } from "./stdlib/assert.js";
import { datetimeModule } from "./stdlib/datetime.js";
import { fsModule } from "./stdlib/fs.js";
import { httpModule } from "./stdlib/http.js";
import { jsonModule } from "./stdlib/json.js";
import { mathModuleExports } from "./stdlib/math.js";
import { regexModule } from "./stdlib/regex.js";
import { stringModuleExports } from "./stdlib/string.js";

const internalStdLibModules = {
  array: arrayModule,
  datetime: datetimeModule,
  fs: fsModule,
  http: httpModule,
  json: jsonModule,
  math: mathModuleExports,
  regex: regexModule,
  string: stringModuleExports,
  assert: assertModule,
};

export class ModuleLoader {
  constructor(interpreter) {
    // console.log("ModuleLoader constructor: interpreter received:", interpreter); // Keep logs for now
    this.interpreter = interpreter;
    // console.log("ModuleLoader constructor: this.interpreter after assignment:", this.interpreter); // Keep logs for now

    this.adapter = interpreter.adapter; // Adapter should be accessible
    this.moduleCache = new Map();
    this.loadingStack = new Set();

    // Ensure executeModule is always bound to this instance
    this.executeModule = this.executeModule.bind(this); // <--- Add this line
  }
  loadModule(importPath, fromFile) {
    // Check if importPath is a known internal JS-backed stdlib module
    if (Object.hasOwn(internalStdLibModules, importPath)) {
      // If already "loaded" (cached) in moduleCache, return that
      if (this.moduleCache.has(importPath)) {
        return this.moduleCache.get(importPath);
      }
      const exports = internalStdLibModules[importPath];
      this.moduleCache.set(importPath, exports); // Cache it by its name
      return exports;
    }

    const resolvedPath = this.resolvePath(importPath, fromFile);

    // Return cached module if already loaded
    if (this.moduleCache.has(resolvedPath)) {
      return this.moduleCache.get(resolvedPath);
    }

    // Check for circular dependency
    if (this.loadingStack.has(resolvedPath)) {
      const loadingChain = Array.from(this.loadingStack).join(" -> ");
      throw this.interpreter.errorHandler.createRuntimeError(
        `Circular module dependency detected: ${loadingChain} -> ${resolvedPath}.`,
        null, // No specific AST node for this type of error
        "MOD003",
        "Break the circular dependency by redesigning your module imports.",
      );
    }

    // Load and execute module
    this.loadingStack.add(resolvedPath);

    try {
      const exports = this.executeModule(resolvedPath);
      this.moduleCache.set(resolvedPath, exports);
      return exports;
    } finally {
      this.loadingStack.delete(resolvedPath);
    }
  }

  resolvePath(importPath, fromFile) {
    // Use adapter for path operations
    const dir = this.adapter.dirname(fromFile);
    const attemptedPaths = [];

    let resolved = this.adapter.resolvePath(dir, importPath);
    attemptedPaths.push(resolved);
    if (this.adapter.existsSync(resolved)) {
      return resolved;
    }

    resolved = this.adapter.resolvePath(dir, `${importPath}.mimo`);
    attemptedPaths.push(resolved);
    if (this.adapter.existsSync(resolved)) {
      return resolved;
    }
    throw this.interpreter.errorHandler.createRuntimeError(
      `Module '${importPath}' not found. Tried paths:\n${attemptedPaths
        .map((p) => `  - ${p}`)
        .join("\n")}`,
      null, // No specific AST node for this path resolution error
      "MOD001",
      "Check the module path and ensure the file exists.",
    );
  }

  executeModule(filePath) {
    // console.log(
    //   "\x1b[36m\n--- Inside ModuleLoader.executeModule for:",
    //   filePath,
    //   "---\x1b[0m"
    // );
    // console.log("  'this' in executeModule:", this);
    // console.log("  'this.interpreter' in executeModule:", this.interpreter);
    if (!this.interpreter) {
      // console.error("CRITICAL: this.interpreter is undefined in executeModule!");
      throw new Error(
        "ModuleLoader critical error: interpreter instance is missing.",
      );
    }
    // console.log("  'this.interpreter.currentEnv' in executeModule (before change):", this.interpreter.currentEnv);
    // console.log("  'this.interpreter.globalEnv' in executeModule:", this.interpreter.globalEnv);

    const originalInterpreterEnv = this.interpreter.currentEnv;
    const originalInterpreterFile = this.interpreter.currentFile;

    try {
      const source = this.adapter.readFileSync(filePath, "utf8");
      const lexer = new Lexer(source, filePath);
      const tokens = [];
      let token;
      while ((token = lexer.nextToken()) !== null) {
        tokens.push(token);
      }
      const parser = new Parser(tokens, filePath);
      // Ensure parser also has access to the errorHandler for rich syntax errors
      parser.setErrorHandler(this.interpreter.errorHandler); // <--- Crucial: Pass errorHandler to parser
      const ast = parser.parse();

      const moduleEnv = new Environment(this.interpreter.globalEnv);
      moduleEnv.isModuleRoot = true;

      // Set up module execution context on the interpreter instance
      this.interpreter.currentEnv = moduleEnv; // <--- The problematic line
      this.interpreter.currentFile = filePath;
      this.interpreter.errorHandler.addSourceFile(filePath, source);

      // console.log("  'this.interpreter.currentEnv' in executeModule (after change):", this.interpreter.currentEnv);

      // Check if module has any explicit exports
      let hasExplicitExports = false;
      for (const statement of ast.body) {
        if (statement.isExported === true) {
          hasExplicitExports = true;
          break;
        }
      }

      // Execute module code
      this.interpreter.visitNode(ast);

      // Collect module exports
      const exports = {};
      if (hasExplicitExports) {
        // Only export declarations with isExported = true
        for (const statement of ast.body) {
          if (statement.isExported === true) {
            if (statement.type === "FunctionDeclaration") {
              exports[statement.name] = moduleEnv.lookup(statement.name);
            } else if (statement.type === "VariableDeclaration") {
              exports[statement.identifier] = moduleEnv.lookup(
                statement.identifier,
              );
            }
            // Note: DestructuringAssignment, PropertyAssignment, and BracketAssignment
            // don't currently support isExported flag, but could be added if needed
          }
        }
      } else {
        // Fallback: if no 'export' keywords were used, export everything (current behavior)
        for (const [name, varInfo] of moduleEnv.vars.entries()) {
          exports[name] = varInfo.value;
        }
      }

      return exports;
    } catch (error) {
      // console.error("MODULE LOADER: Error during module execution for", filePath, ":", error);
      if (error instanceof MimoError) {
        throw error;
      } // Re-throw MimoError as is
      // Wrap any other JS errors. Need to pass an AST node if possible for location.
      throw this.interpreter.errorHandler.createRuntimeError(
        `Error loading module '${filePath}': ${error.message}`,
        null, // No specific AST node for the module file, pass null.
        "MOD004",
        "An unexpected error occurred while loading this module. Check its syntax or dependencies.",
      );
    } finally {
      // Restore previous execution context
      if (this.interpreter) {
        // Check if interpreter exists before restoring (safety)
        this.interpreter.currentEnv = originalInterpreterEnv;
        this.interpreter.currentFile = originalInterpreterFile;
        this.interpreter.errorHandler.clearSourceFile(filePath);
      }
      // console.log(
      //   "\x1b[36m--- End ModuleLoader.executeModule for:",
      //   filePath,
      //   "---\x1b[0m"
      // );
    }
  }

  getModuleInfo(alias) {
    // Helper method to get available properties for error messages
    const moduleExports = this.interpreter.modules?.get(alias);
    if (!moduleExports) {
      return null;
    }

    return {
      alias,
      properties: Object.keys(moduleExports).sort(),
    };
  }
}
