import { FunctionValue } from '../interpreter/Values.js';
import { BuiltinFunction } from '../interpreter/BuiltinFunction.js';

/**
 * Formats a Mimo value for REPL output.
 * @param {any} value The value to format
 * @param {boolean} useColors Whether to use ANSI colors
 * @param {number} indent Current indentation level
 * @returns {string} Colored or plain string
 */
export function formatValue(value, useColors = true, indent = 0) {
    const spacing = "  ".repeat(indent);

    const colors = {
        grey: useColors ? "\x1b[90m" : "",
        cyan: useColors ? "\x1b[36m" : "",
        green: useColors ? "\x1b[32m" : "",
        yellow: useColors ? "\x1b[33m" : "",
        magenta: useColors ? "\x1b[35m" : "",
        blue: useColors ? "\x1b[34m" : "",
        reset: useColors ? "\x1b[0m" : ""
    };

    if (value === null || value === undefined) return `${colors.grey}null${colors.reset}`;

    // Handle Functions specially to avoid printing the AST
    if (value instanceof FunctionValue || (value && value.constructor && value.constructor.name === "FunctionValue")) {
        const name = value.name === '<anonymous>' ? 'anonymous' : value.name;
        return `${colors.cyan}[Function: ${name}]${colors.reset}`;
    }

    if (value instanceof BuiltinFunction || (value && value.constructor && value.constructor.name === "BuiltinFunction")) {
        return `${colors.cyan}[BuiltinFunction: ${value.name}]${colors.reset}`;
    }

    if (value instanceof Date) {
        return `${colors.green}datetime(${value.toISOString()})${colors.reset}`;
    }

    if (Array.isArray(value)) {
        if (value.length === 0) return `${colors.grey}[]${colors.reset}`;

        const items = value.map(v => formatValue(v, useColors, indent + 1));
        const flatItems = items.join(`${colors.grey}, ${colors.reset}`);

        // Use single-line if short enough
        if (flatItems.length < 50) {
            return `${colors.grey}[${colors.reset}${flatItems}${colors.grey}]${colors.reset}`;
        }

        // Multi-line for large arrays
        return `${colors.grey}[${colors.reset}\n${spacing}  ${items.join(`${colors.grey},${colors.reset}\n` + spacing + "  ")}\n${spacing}${colors.grey}]${colors.reset}`;
    }

    if (typeof value === "object") {
        const keys = Object.keys(value);
        if (keys.length === 0) return `${colors.grey}{}${colors.reset}`;

        const pairs = keys.map(k => {
            const val = formatValue(value[k], useColors, indent + 1);
            return `${colors.blue}${k}${colors.reset}${colors.grey}:${colors.reset} ${val}`;
        });

        const flatPairs = pairs.join(`${colors.grey}, ${colors.reset}`);

        // Use single-line if short enough
        if (flatPairs.length < 50) {
            return `${colors.grey}{${colors.reset}${flatPairs}${colors.grey}}${colors.reset}`;
        }

        // Multi-line for large objects
        return `${colors.grey}{${colors.reset}\n${spacing}  ${pairs.join(`${colors.grey},${colors.reset}\n` + spacing + "  ")}\n${spacing}${colors.grey}}${colors.reset}`;
    }

    if (typeof value === "string") return `${colors.green}"${value}"${colors.reset}`;
    if (typeof value === "number") return `${colors.yellow}${value}${colors.reset}`;
    if (typeof value === "boolean") return `${colors.magenta}${value}${colors.reset}`;

    return String(value);
}
