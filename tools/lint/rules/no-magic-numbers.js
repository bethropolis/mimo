// A Set of numbers that are commonly allowed (and not "magic")
const ALLOWED_NUMBERS = new Set([0, 1, -1, 10, 100, 1000]);

export const noMagicNumbers = {
    meta: {
        type: 'suggestion',
        description: 'Disallow magic numbers - prefer named constants',
    },
    create: (context) => {
        return {
            // This listener will run for every Literal node the linter encounters.
            Literal: (node) => {
                // We only care about numeric literals.
                if (typeof node.value !== 'number') {
                    return;
                }
                
                // Ignore numbers that are commonly used and not considered "magic".
                if (ALLOWED_NUMBERS.has(node.value)) {
                    return;
                }
                
                // Get the parent node to check the context.
                const parent = context.getParent(node);

                // Allow numbers if they are the direct value of a `const` declaration.
                if (parent.type === 'VariableDeclaration' && parent.kind === 'const') {
                    return;
                }
                
                // If it's a "magic number", report it.
                context.report({
                    node: node,
                    message: `Magic number '${node.value}' detected. Consider declaring it as a named constant.`,
                });
            }
        };
    }
};