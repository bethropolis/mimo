/**
 * no-shadow
 *
 * Disallows variable or function declarations that shadow a binding from an
 * outer scope.  Shadowing makes code harder to reason about and can hide bugs.
 *
 * Checks:
 *   - `let` / `const` / `global` VariableDeclarations
 *   - FunctionDeclarations (the function name itself)
 *   - Function parameters (declared inside FunctionDeclaration / AnonymousFunction)
 */

export const noShadow = {
    meta: {
        type: 'problem',
        description: 'Disallow variable declarations that shadow variables in outer scopes',
        defaultSeverity: 'warning',
    },
    create: (context) => {
        /**
         * Check whether `name` already exists in any *ancestor* scope (not the
         * current scope, since the declaration hasn't been committed yet when the
         * node-entry listener fires for VariableDeclaration, but the scope tracker
         * has already called enterNode which calls declare() — so we look for
         * an owning scope that is an ancestor of the current scope).
         */
        function isShadowing(name) {
            const tracker = context.getScope();
            const current = tracker.getCurrentScope();

            // Walk up the parent chain looking for the binding.
            let ancestor = current.parent;
            while (ancestor) {
                if (ancestor.variables.has(name)) return true;
                ancestor = ancestor.parent;
            }
            return false;
        }

        return {
            VariableDeclaration: (node) => {
                if (typeof node.identifier !== 'string') return; // destructuring — skip
                if (node.kind === 'set') return; // re-assignment, not a new binding

                if (isShadowing(node.identifier)) {
                    context.report({
                        node,
                        message: `'${node.identifier}' shadows a variable from an outer scope.`,
                    });
                }
            },

            FunctionDeclaration: (node) => {
                // The function name is declared in the parent scope, so we check
                // whether any *grandparent-or-higher* scope owns the same name.
                const tracker = context.getScope();
                const current = tracker.getCurrentScope(); // already the new fn scope

                // Function name lives in current.parent (the scope that surrounds the fn).
                // We want to know if current.parent.parent or higher has the same name.
                let ancestor = current.parent?.parent;
                while (ancestor) {
                    if (ancestor.variables.has(node.name)) {
                        context.report({
                            node,
                            message: `Function '${node.name}' shadows a variable from an outer scope.`,
                        });
                        break;
                    }
                    ancestor = ancestor.parent;
                }

                // Also check parameters — they are declared in the function's own scope
                // (current), so check current.parent and above.
                const paramScope = current.parent;
                (node.params || []).forEach(param => {
                    let a = paramScope;
                    while (a) {
                        if (a.variables.has(param.name)) {
                            context.report({
                                node: param,
                                message: `Parameter '${param.name}' shadows a variable from an outer scope.`,
                            });
                            break;
                        }
                        a = a.parent;
                    }
                });
            },

            AnonymousFunction: (node) => {
                // Parameters in the function's scope — check parent and above.
                const tracker = context.getScope();
                const current = tracker.getCurrentScope(); // the anonymous fn scope
                const paramScope = current.parent;

                (node.params || []).forEach(param => {
                    let a = paramScope;
                    while (a) {
                        if (a.variables.has(param.name)) {
                            context.report({
                                node: param,
                                message: `Parameter '${param.name}' shadows a variable from an outer scope.`,
                            });
                            break;
                        }
                        a = a.parent;
                    }
                });
            },
        };
    },
};
