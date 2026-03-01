// bin/utils/colors.js
// Tiny zero-dependency ANSI color helper.
// Colors are suppressed automatically when:
//   - stdout is not a TTY (pipe / redirect)
//   - NO_COLOR env var is set (https://no-color.org)

const enabled = process.stdout.isTTY && !process.env.NO_COLOR;

const code = (n) => enabled ? `\x1b[${n}m` : '';
const reset = code(0);
const wrap  = (n, s) => `${code(n)}${s}${reset}`;

export const c = {
    // Foreground colours
    green:   (s) => wrap(32, s),
    red:     (s) => wrap(31, s),
    yellow:  (s) => wrap(33, s),
    blue:    (s) => wrap(34, s),
    cyan:    (s) => wrap(36, s),
    magenta: (s) => wrap(35, s),
    white:   (s) => wrap(37, s),

    // Styles
    bold:    (s) => wrap(1,  s),
    dim:     (s) => wrap(2,  s),
    italic:  (s) => wrap(3,  s),

    // Semantic aliases
    success: (s) => wrap(32, s),   // green
    error:   (s) => wrap(31, s),   // red
    warn:    (s) => wrap(33, s),   // yellow
    info:    (s) => wrap(36, s),   // cyan
    muted:   (s) => wrap(2,  s),   // dim

    // Raw reset (useful for building multi-segment strings)
    reset,
    enabled,
};
