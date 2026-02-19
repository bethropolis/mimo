import { ErrorHandler } from "./ErrorHandler.js";
import { BaseExecutor } from "./executors/BaseExecutor.js";
import { VariableExecutor } from "./executors/VariableExecutor.js";
import { ControlFlowExecutor } from "./executors/ControlFlowExecutor.js";
import { FunctionExecutor } from "./executors/FunctionExecutor.js";
import { PatternMatchExecutor } from "./executors/PatternMatchExecutor.js";
import { MimoError } from "./MimoError.js";


export class StatementExecutor {
  constructor(interpreter) {
    this.interpreter = interpreter;
    
    // Initialize specialized executors
    this.baseExecutor = new BaseExecutor(interpreter);
    this.variableExecutor = new VariableExecutor(interpreter);
    this.controlFlowExecutor = new ControlFlowExecutor(interpreter);
    this.functionExecutor = new FunctionExecutor(interpreter);
    this.patternMatchExecutor = new PatternMatchExecutor(interpreter);
  }

  executeStatement(node) {
    switch (node.type) {
      case "Program":
        return this.baseExecutor.executeProgram(node);
      
      // Variable and assignment operations
      case "VariableDeclaration":
        return this.variableExecutor.executeVariableDeclaration(node);
      case "DestructuringAssignment":
        return this.variableExecutor.executeDestructuringAssignment(node);
      case "PropertyAssignment":
        return this.variableExecutor.executePropertyAssignment(node);
      case "BracketAssignment":
        return this.variableExecutor.executeBracketAssignment(node);
      
      // Control flow operations
      case "IfStatement":
        return this.controlFlowExecutor.executeIfStatement(node);
      case "WhileStatement":
        return this.controlFlowExecutor.executeWhileStatement(node);
      case "ForStatement":
        return this.controlFlowExecutor.executeForStatement(node);
      case "LoopStatement":
        return this.controlFlowExecutor.executeLoopStatement(node);
      case "BreakStatement":
        return this.controlFlowExecutor.executeBreakStatement(node);
      case "ContinueStatement":
        return this.controlFlowExecutor.executeContinueStatement(node);
      case "TryStatement":
        return this.controlFlowExecutor.executeTryStatement(node);
      
      // Function operations
      case "FunctionDeclaration":
        return this.functionExecutor.executeFunctionDeclaration(node);
      case "CallStatement":
        return this.functionExecutor.executeCallStatement(node);
      case "ReturnStatement":
        return this.functionExecutor.executeReturnStatement(node);
      case "ShowStatement":
        return this.functionExecutor.executeShowStatement(node);
      case "ThrowStatement":
        return this.functionExecutor.executeThrowStatement(node);
      
      // Pattern matching operations
      case "MatchStatement":
        return this.patternMatchExecutor.executeMatchStatement(node);
      
      // Module system operations
      case "ImportStatement":
        return this.executeImportStatement(node);
      
      default:
        throw this.interpreter.errorHandler.createRuntimeError(
          `Unknown statement type: ${node.type}`,
          node,
          'RUN000',
          'This indicates a bug in the interpreter. Please report this error.'
        );
    }
  }


  executeImportStatement(node) {
    try {
      const exports = this.interpreter.moduleLoader.loadModule(node.path, this.interpreter.currentFile);
      this.interpreter.currentEnv.define(node.alias, exports, 'const');
    } catch (error) {

      if (error instanceof MimoError) {
        throw error;
      }
      
      throw this.interpreter.errorHandler.createRuntimeError(
        error.message, 
        node,
        'MOD001',
        'Check if the module path is correct and the module exists.'
      );
    }
    return null; 
  }
}