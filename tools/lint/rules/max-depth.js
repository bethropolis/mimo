/**
 * max-depth
 *
 * Enforces a maximum depth for nested block-creating constructs (if, while,
 * for, loop, match/case, try).  Helps prevent deeply-nested, hard-to-read code.
 *
 * Options:
 *   max {number}  — maximum allowed nesting depth (default: 4)
 *
 * Example config:
 *   "max-depth": { "max": 3 }
 */

/** Node types that increase the nesting depth tracked by LinterScopeTracker. */
const BLOCK_TYPES = new Set([
    'IfStatement',
    'WhileStatement',
    'ForStatement',
    'LoopStatement',
    'MatchStatement',
    'CaseClause',
    'TryStatement',
]);

export const maxDepth = {
    meta: {
        type: 'suggestion',
        description: 'Enforce a maximum depth for nested blocks',
        defaultSeverity: 'warning',
    },
    create: (context) => {
        const maxAllowed = typeof context.options?.max === 'number'
            ? context.options.max
            : 4;

        return {
            // Use a generic visitor that fires for all block-creating node types.
            // We check the depth *after* enterNode has already incremented it,
            // so the current depth equals the depth of this node.
            ...Object.fromEntries(
                [...BLOCK_TYPES].map(nodeType => [
                    nodeType,
                    (node) => {
                        const depth = context.getScope().getCurrentDepth();
                        if (depth > maxAllowed) {
                            context.report({
                                node,
                                message: `Block nesting depth (${depth}) exceeds the maximum allowed (${maxAllowed}).`,
                            });
                        }
                    },
                ])
            ),
        };
    },
};
