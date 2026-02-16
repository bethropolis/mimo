import { Environment } from './environment.js';



export class ReturnValue {
    constructor(value) {
        this.value = value;
    }
}

export class BreakException {
    constructor(label = null) {
        this.label = label;
    }
}

export class ContinueException {
    constructor(label = null) {
        this.label = label;
    }
}

export class FunctionValue {
    constructor(declaration, closure) {
        this.declaration = declaration;
        this.closure = closure;
        // Add a name property, defaulting to '<anonymous>' if not declared.
        this.name = declaration.name || '<anonymous>';
    }

    call(interpreter, args, callNode) {
        const { params, defaults, restParam } = this.declaration;

        // --- Arity Check ---
        const requiredParamsCount = params.filter(pNode => !defaults[pNode.name]).length;
        if (args.length < requiredParamsCount) {
            throw interpreter.errorHandler.createRuntimeError(
                `Function '${this.name}' expects at least ${requiredParamsCount} arguments but received ${args.length}.`,
                callNode, 'FUNC001'
            );
        }
        if (!restParam && args.length > params.length) {
            throw interpreter.errorHandler.createRuntimeError(
                `Function '${this.name}' expects at most ${params.length} arguments but received ${args.length}.`,
                callNode, 'FUNC002'
            );
        }

        // --- Environment Setup ---
        const env = new Environment(this.closure, false, true);

        // Bind regular parameters by iterating over the Identifier nodes
        params.forEach((paramNode, i) => {
            const paramName = paramNode.name;
            let value = args[i]; // Get the passed argument

            if (value === undefined) {
                // If no argument was passed, check for a default value
                if (defaults[paramName]) {
                    value = interpreter.visitNode(defaults[paramName]);
                } else {
                    // This case should be caught by arity check, but is a safeguard
                    throw new Error(`Interpreter Error: Missing value for required parameter ${paramName}`);
                }
            }
            env.define(paramName, value);
        });

        // Handle rest parameter if it exists
        if (restParam) {
            const restArgs = args.slice(params.length);
            env.define(restParam.name, restArgs);
        }

        // --- Execution ---
        interpreter.pushCallStack(this.name, callNode);
        try {
            const result = interpreter.executeBlock(this.declaration.body, env);
            if (result instanceof ReturnValue) {
                return result.value;
            }
            return null; // Implicit return of null
        } finally {
            interpreter.popCallStack();
        }
    }
}