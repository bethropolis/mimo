/**
 * Base class for all Mimo language converters.
 *
 * Provides shared infrastructure:
 *  - output buffer management (write / writeLine)
 *  - indentation tracking (indent / dedent)
 *  - visitor dispatch (visitNode / visitBlock)
 *  - shared constants (CORE_BUILTINS, STDLIB_MODULES)
 *  - argument-list emitter (emitArgs)
 *
 * Every language-specific converter should extend this class and override:
 *  - convert(ast)  — entry point, builds the header/footer and calls visitNode(ast)
 *  - any visitXxx(node) methods for language-specific code generation
 */

/** Built-in functions that are provided by the Mimo runtime object. */
export const CORE_BUILTINS = new Set([
    "len",
    "get",
    "update",
    "type",
    "push",
    "pop",
    "slice",
    "range",
    "join",
    "has_property",
    "keys",
    "values",
    "entries",
    "get_arguments",
    "get_env",
    "exit_code",
    "coalesce",
    "get_property_safe",
    "if_else",
]);

/**
 * All known Mimo standard-library module names.
 * When an import path matches one of these names it is a stdlib import,
 * not a relative file import.
 */
export const STDLIB_MODULES = new Set([
    "array",
    "assert",
    "datetime",
    "env",
    "fs",
    "http",
    "json",
    "math",
    "object",
    "path",
    "regex",
    "string",
]);

export class BaseConverter {
    constructor() {
        this.output = "";
        this.indentation = "    ";
        this.currentIndent = "";
    }

    // -------------------------------------------------------------------------
    // Output helpers
    // -------------------------------------------------------------------------

    /** Append raw text to the output buffer. */
    write(text) {
        this.output += text;
    }

    /**
     * Append an indented line to the output buffer.
     * Calling with no argument emits a blank line.
     */
    writeLine(line = "") {
        if (line === "") {
            this.output += "\n";
        } else {
            this.output += this.currentIndent + line + "\n";
        }
    }

    // -------------------------------------------------------------------------
    // Indentation helpers
    // -------------------------------------------------------------------------

    indent() {
        this.currentIndent += this.indentation;
    }

    dedent() {
        this.currentIndent = this.currentIndent.slice(0, -this.indentation.length);
    }

    // -------------------------------------------------------------------------
    // Spacing helpers
    // -------------------------------------------------------------------------

    /**
     * Emit blank lines to preserve the visual spacing between two consecutive
     * statements from the original source.
     *
     * When the current statement starts more than one line after the previous
     * statement ended, at least one blank line existed in the source. We emit
     * exactly one blank line in that case (we don't replicate multiple blanks).
     *
     * @param {Object} currentNode  - The AST node about to be emitted.
     * @param {Object|null} prevNode - The previously emitted AST node, or null
     *   if this is the first statement in the block.
     */
    emitLineGap(currentNode, prevNode) {
        if (!prevNode || !currentNode) return;
        const prevLine = (prevNode.line || 0);
        const currLine = (currentNode.line || 0);
        if (currLine - prevLine > 1) {
            this.writeLine();
        }
    }

    // -------------------------------------------------------------------------
    // Visitor dispatch
    // -------------------------------------------------------------------------

    /**
     * Dispatch to the appropriate visitor method based on node.type.
     * Falls back to onUndefinedVisitor() when no handler exists.
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
     * Visit a list of statements with one extra level of indentation.
     * Language-specific converters may override this (e.g. Python needs
     * `pass` for empty blocks).
     */
    visitBlock(statements) {
        this.indent();
        (statements || []).forEach((stmt) => this.visitNode(stmt));
        this.dedent();
    }

    /**
     * Called when visitNode() cannot find a matching visitor.
     * Override to log a warning or throw in strict mode.
     */
    onUndefinedVisitor(node) {
        // default: silent — sub-classes may warn
    }

    // -------------------------------------------------------------------------
    // Shared expression helpers
    // -------------------------------------------------------------------------

    /**
     * Emit a comma-separated argument list.
     * Each element is visited via visitNode().
     */
    emitArgs(args) {
        (args || []).forEach((arg, i) => {
            if (arg.type === "SpreadElement") {
                this.emitSpread(arg);
            } else {
                this.visitNode(arg);
            }
            if (i < args.length - 1) this.write(", ");
        });
    }

    /**
     * Emit a spread element.  Sub-classes should override if they need
     * language-specific spread syntax (e.g. Python uses `*expr`).
     */
    emitSpread(node) {
        this.write("...");
        this.visitNode(node.argument);
    }

    /**
     * Build the parameter name list for a function declaration or anonymous
     * function node, respecting rest parameters.
     * Returns an array of strings (already formatted for the target language).
     */
    buildParamNames(node) {
        const names = (node.params || []).map((p) => p.name);
        if (node.restParam) {
            names.push(`...${node.restParam.name}`);
        }
        return names;
    }

    /**
     * Returns true when `modulePath` refers to a Mimo stdlib module.
     */
    isStdlibModule(modulePath) {
        return STDLIB_MODULES.has(modulePath);
    }

    /**
     * Returns true when `name` is a Mimo core built-in.
     */
    isCoreBuiltin(name) {
        return CORE_BUILTINS.has(name);
    }

    // -------------------------------------------------------------------------
    // Entry point (must be overridden)
    // -------------------------------------------------------------------------

    /**
     * Convert an AST to the target language source string.
     * @param {Object} ast - The root Program node.
     * @returns {string}
     */
    convert(ast) {
        throw new Error(`${this.constructor.name} must implement convert(ast)`);
    }
}
