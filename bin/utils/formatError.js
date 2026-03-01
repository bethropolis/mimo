// bin/utils/formatError.js
// Renders a Mimo parse error as a source snippet with a caret pointer.
// Only structured errors (those with a `.location` object) get the snippet;
// plain strings / runtime errors are printed as-is.

import { c } from './colors.js';

/**
 * Format a Mimo error for terminal output.
 *
 * @param {unknown}  err     The caught value (MimoError, Error, or string)
 * @param {string}   [src]   Raw source text (used to extract the snippet line)
 * @returns {string}         The formatted string, ready for console.error()
 */
export function formatError(err, src) {
    // Structured Mimo error with location info
    if (err && typeof err === 'object' && err.location) {
        const { line, column } = err.location;
        const tag   = c.bold(c.red(`[${err.code ?? 'Error'}]`));
        const label = c.bold(err.message ?? String(err));
        let out = `${tag} ${label}`;

        if (src && line) {
            const lines  = src.split('\n');
            const srcLine = lines[line - 1] ?? '';
            const lineNo  = String(line).padStart(4);
            const col     = Math.max(0, (column ?? 1) - 1);

            out += `\n${c.dim(`${lineNo} │`)} ${srcLine}`;
            out += `\n     ${' '.repeat(col)}${c.red('^')}`;
        }

        if (err.file) {
            out += `\n${c.dim(`     at ${err.file}:${line ?? '?'}:${column ?? '?'}`)}`;
        }

        return out;
    }

    // Plain string (Mimo.run() sometimes throws formatted strings)
    if (typeof err === 'string') {
        return c.red(err);
    }

    // Standard Error or anything else
    return c.red(err?.message ?? String(err));
}
