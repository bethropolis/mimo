/**
 * no-empty-function
 *
 * Disallows function declarations and anonymous functions whose body contains
 * no executable statements.
 *
 * An empty body is defined as `body` being an empty array, or an array that
 * contains only comment-like nodes (nodes without a `type` property, e.g.
 * null/undefined elements).  A body with any typed AST node is not empty.
 */

function isEmptyBody(body) {
    if (!Array.isArray(body) || body.length === 0) return true;
    // Consider the body non-empty if at least one element is a real AST node.
    return !body.some(item => item && typeof item === 'object' && item.type);
}

export const noEmptyFunction = {
    meta: {
        type: 'suggestion',
        description: 'Disallow empty function bodies',
        defaultSeverity: 'warning',
    },
    create: (context) => {
        return {
            FunctionDeclaration: (node) => {
                if (isEmptyBody(node.body)) {
                    context.report({
                        node,
                        message: `Function '${node.name}' has an empty body.`,
                    });
                }
            },

            AnonymousFunction: (node) => {
                if (isEmptyBody(node.body)) {
                    context.report({
                        node,
                        message: 'Anonymous function has an empty body.',
                    });
                }
            },
        };
    },
};
