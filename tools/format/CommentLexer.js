/**
 * tools/format/CommentLexer.js
 *
 * A lightweight, self-contained scanner that extracts all comments from raw
 * Mimo source without going through the main Lexer/Parser pipeline.
 *
 * This is the formatter-only path for comment preservation (A1).
 * It deliberately does NOT touch the main lexer or any interpreter code.
 *
 * Returns:
 *   {
 *     comments: Array<{ kind: 'line'|'block', value: string, line: number,
 *                        column: number, startOffset: number, endOffset: number }>,
 *     lineOffsets: number[]   // lineOffsets[n] = char offset where line n+1 starts
 *   }
 */

export function extractComments(source) {
    const comments = [];
    // lineOffsets[i] = char index of the first character of line (i+1).
    // lineOffsets[0] = 0 (line 1 starts at offset 0)
    const lineOffsets = [0];

    let i = 0;
    let line = 1;
    let column = 1;

    // Track whether we are inside a string or template literal so we don't
    // mistake comment-like sequences inside strings for actual comments.
    let inString = false;
    let inTemplate = 0; // nesting depth for backtick templates
    let inInterpolation = 0; // depth of ${ } inside templates

    function advance() {
        const ch = source[i];
        i++;
        if (ch === '\n') {
            lineOffsets.push(i);
            line++;
            column = 1;
        } else {
            column++;
        }
        return ch;
    }

    function peek(offset = 0) {
        return source[i + offset] ?? null;
    }

    while (i < source.length) {
        const ch = peek();

        // ── Template literals ────────────────────────────────────────────────
        if (!inString && ch === '`') {
            advance();
            inTemplate++;
            continue;
        }
        if (inTemplate > 0 && !inString) {
            if (ch === '`') {
                advance();
                inTemplate--;
                continue;
            }
            if (ch === '$' && peek(1) === '{') {
                advance(); advance();
                inInterpolation++;
                continue;
            }
            if (inInterpolation === 0) {
                // inside template fragment — consume (handle escapes)
                if (ch === '\\') { advance(); advance(); continue; }
                advance();
                continue;
            }
            // inside interpolation — fall through to normal processing
            if (ch === '}') {
                advance();
                inInterpolation--;
                continue;
            }
        }

        // ── Regular strings ──────────────────────────────────────────────────
        if (!inString && (ch === '"' || ch === "'")) {
            const quote = ch;
            advance();
            inString = true;
            while (i < source.length) {
                const sc = peek();
                if (sc === '\\') { advance(); advance(); continue; }
                if (sc === quote) { advance(); inString = false; break; }
                if (sc === '\n') { advance(); break; } // unterminated — let the real lexer handle it
                advance();
            }
            continue;
        }

        // ── Line comment: // ─────────────────────────────────────────────────
        if (ch === '/' && peek(1) === '/') {
            const startOffset = i;
            const startLine = line;
            const startCol = column;
            advance(); advance(); // consume '//'
            let value = '';
            while (i < source.length && peek() !== '\n') {
                value += peek();
                advance();
            }
            comments.push({
                kind: 'line',
                value: value.trim(),
                line: startLine,
                column: startCol,
                startOffset,
                endOffset: i,
            });
            continue;
        }

        // ── Block comment: /* … */ ───────────────────────────────────────────
        if (ch === '/' && peek(1) === '*') {
            const startOffset = i;
            const startLine = line;
            const startCol = column;
            advance(); advance(); // consume '/*'
            let value = '';
            while (i < source.length) {
                if (peek() === '*' && peek(1) === '/') {
                    advance(); advance();
                    break;
                }
                value += peek();
                advance();
            }
            comments.push({
                kind: 'block',
                value: value.trim(),
                line: startLine,
                column: startCol,
                startOffset,
                endOffset: i,
            });
            continue;
        }

        advance();
    }

    return { comments, lineOffsets };
}
