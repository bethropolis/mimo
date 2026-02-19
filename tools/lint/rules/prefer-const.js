export const preferConst = {
    meta: {
        type: 'suggestion',
        description: 'Suggest using `const` for variables that are never reassigned.',
    },
    create: (context) => {
        return {
            Program_exit: (programNode) => {
                const unmutatedLets = context.getScope().getUnmutatedLets();
                unmutatedLets.forEach(variable => {
                    context.report({
                        node: variable.node,
                        message: `Variable '${variable.name}' is never reassigned. Use 'const' instead.`,
                    });
                });
            }
        };
    }
};