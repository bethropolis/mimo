export const noUnusedVars = {
    meta: {
        type: 'suggestion',
        description: 'Disallow unused variables and function parameters',
    },
    create: (context) => {
        return {
            // This runs once after the entire file has been traversed.
            Program_exit: (programNode) => {
                const unused = context.getScope().getUnusedVariables();
                unused.forEach(variable => {
                    let message;
                    if (variable.kind === 'parameter') {
                        message = `Parameter '${variable.name}' is defined but never used.`;
                    } else {
                        message = `Variable '${variable.name}' is defined but never used.`;
                    }
                    context.report({
                        node: variable.node,
                        message: message,
                    });
                });
            }
        };
    }
};