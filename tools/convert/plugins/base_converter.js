/**
 * Base class for Mimo language converters.
 * All new converters should implement this interface.
 */
export class BaseConverter {
    constructor() {
        this.output = "";
        this.indentation = "    ";
        this.currentIndent = "";
    }

    /**
     * Entry point for the conversion process.
     * @param {Object} ast - The Mimo AST to convert.
     * @returns {string} The converted source code.
     */
    convert(ast) {
        throw new Error("Converter must implement convert() method");
    }

    /**
     * Standard visit method to dispatch based on node type.
     * @param {Object} node - AST node.
     */
    visitNode(node) {
        if (!node || !node.type) return;
        const visitor = this[`visit${node.type}`];
        if (visitor) {
            visitor.call(this, node);
        } else {
            this.onUndefinedVisitor(node);
        }
    }

    /**
     * Hook for handling nodes without a specific visitor.
     * Override this to handle or log missing visitors.
     */
    onUndefinedVisitor(node) {
        // Default: ignore or console.warn
    }
}
