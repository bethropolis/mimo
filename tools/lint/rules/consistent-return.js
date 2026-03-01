/**
 * consistent-return
 *
 * Requires that functions either always return a value, or never return a
 * value.  Mixing `return` (bare) and `return <expr>` in the same function
 * is confusing and often a bug.
 *
 * Uses entry/exit listeners to track per-function state on a stack.
 */

export const consistentReturn = {
    meta: {
        type: 'problem',
        description: 'Require consistent use of `return` in functions',
        defaultSeverity: 'warning',
    },
    create: (context) => {
        /**
         * Stack of per-function frames.
         * Each frame: { node, hasValueReturn: bool, hasVoidReturn: bool }
         */
        const stack = [];

        function enterFunction(node) {
            stack.push({ node, hasValueReturn: false, hasVoidReturn: false });
        }

        function exitFunction() {
            const frame = stack.pop();
            if (!frame) return;

            if (frame.hasValueReturn && frame.hasVoidReturn) {
                const label = frame.node.name
                    ? `Function '${frame.node.name}'`
                    : 'Anonymous function';
                context.report({
                    node: frame.node,
                    message: `${label} inconsistently returns a value — some paths return a value and others do not.`,
                });
            }
        }

        return {
            FunctionDeclaration:          enterFunction,
            'FunctionDeclaration:exit':   exitFunction,

            AnonymousFunction:            enterFunction,
            'AnonymousFunction:exit':     exitFunction,

            ReturnStatement: (node) => {
                const frame = stack[stack.length - 1];
                if (!frame) return;

                if (node.argument !== null && node.argument !== undefined) {
                    frame.hasValueReturn = true;
                } else {
                    frame.hasVoidReturn = true;
                }
            },
        };
    },
};
