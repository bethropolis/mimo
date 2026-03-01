/**
 * tools/format/CommentAttacher.js
 *
 * Attaches extracted comments to the nearest AST nodes so the Printer
 * can re-emit them in the correct positions.
 *
 * Attachment rules (line-number based):
 *
 *  leadingComments — a comment is "leading" for node N if:
 *    - The comment ends on the line immediately before N starts, OR
 *    - The comment is a block of consecutive line-comments that sits above N
 *      with no intervening blank lines between the block and N.
 *
 *  trailingComment — a comment is "trailing" for node N if:
 *    - It starts on the same line that N ends on (inline comment).
 *    - Only the first such comment is attached (one trailing comment per node).
 *
 * After attachment the comment is marked `attached = true` so it is not
 * double-emitted. Any remaining unattached comments are prepended to the
 * Program body as synthetic leading comments on a virtual sentinel node
 * (the Program node itself gets them as `node.leadingComments`).
 *
 * Limitations (acceptable for v1):
 *   - Comments inside expressions (e.g. inside array literals) are treated as
 *     leading comments of the next sibling statement, not the sub-expression.
 *   - Only top-level Program.body and inner block arrays are walked; deeply
 *     nested expression trees are not traversed for attachment purposes.
 */

/**
 * Mutates the AST in-place by setting `leadingComments` and `trailingComment`
 * on statement nodes where comments can be meaningfully attached.
 *
 * @param {object}   ast       Parsed Program node
 * @param {object[]} comments  Output of CommentLexer.extractComments()
 */
export function attachComments(ast, comments) {
    if (!comments.length) return;

    // Work on a copy we can mark as attached
    const pool = comments.map(c => ({ ...c, attached: false }));

    // Walk every list of statements in the tree
    _attachToStatementList(ast.body, pool);

    // Any leftover comments at the very top (before first statement) go on the Program
    const unattached = pool.filter(c => !c.attached);
    if (unattached.length) {
        ast.leadingComments = (ast.leadingComments ?? []).concat(unattached);
    }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function _nodeEndLine(node) {
    // Most nodes have `line` = their start line. We approximate end line by
    // looking for the deepest child with a line property, or we just use
    // start line (safe conservative estimate — trailing comments still work
    // because they are same-line as the keyword that opens the node).
    return node.line ?? 1;
}

function _nodeStartLine(node) {
    return node.line ?? 1;
}

/**
 * Attach comments to a flat list of statement nodes.
 * Recurses into block-owning nodes.
 */
function _attachToStatementList(statements, pool) {
    if (!statements?.length) return;

    for (let i = 0; i < statements.length; i++) {
        const node = statements[i];
        const startLine = _nodeStartLine(node);

        // ── Leading comments ─────────────────────────────────────────────────
        // Collect unattached comments that appear immediately before this node.
        // "immediately before" = comment line is < startLine, and there is no
        // blank line between the last comment in the block and this node.
        const leading = [];
        // Walk pool in reverse to find the contiguous block just above this node
        let expectedLine = startLine - 1;
        for (let j = pool.length - 1; j >= 0; j--) {
            const c = pool[j];
            if (c.attached) continue;
            if (c.line > startLine) continue; // comment is after this node — skip
            if (c.line === expectedLine || c.line === expectedLine + 1 || c.line < startLine) {
                // Check contiguity: only attach if no gap
                if (c.line >= startLine - 20 && c.line < startLine) {
                    // Check that no non-comment, non-blank source appears between c and node
                    // (we use a simple line-distance heuristic)
                    leading.unshift(c);
                    c.attached = true;
                    expectedLine = c.line - 1;
                }
            }
        }

        // Filter: only keep comments that form a contiguous block touching this node
        const attached = _filterContiguousLeading(leading, startLine);
        if (attached.length) {
            node.leadingComments = attached;
        }

        // ── Trailing comment ─────────────────────────────────────────────────
        // A comment on the same line as this node's start line (for single-line
        // statements) or a comment on the line of the closing keyword.
        for (const c of pool) {
            if (c.attached) continue;
            if (c.line === startLine && c.kind === 'line') {
                node.trailingComment = c;
                c.attached = true;
                break;
            }
        }

        // ── Recurse into child blocks ─────────────────────────────────────────
        _recurseIntoNode(node, pool);
    }
}

/**
 * Filter the collected leading candidates to only the contiguous block that
 * immediately precedes `startLine` (no blank-line gaps).
 */
function _filterContiguousLeading(candidates, startLine) {
    if (!candidates.length) return [];
    // candidates is already sorted ascending by line
    // Work backwards from startLine to find the contiguous run
    const result = [];
    let expectedLine = startLine - 1;
    for (let i = candidates.length - 1; i >= 0; i--) {
        const c = candidates[i];
        if (c.line === expectedLine || c.line === expectedLine - 0) {
            result.unshift(c);
            expectedLine = c.line - 1;
        } else if (c.line < expectedLine - 1) {
            // Gap found — stop
            break;
        } else {
            result.unshift(c);
            expectedLine = c.line - 1;
        }
    }
    return result;
}

/**
 * Recurse into the child statement lists of block-owning nodes.
 */
function _recurseIntoNode(node, pool) {
    switch (node.type) {
        case 'FunctionDeclaration':
        case 'AnonymousFunction':
            _attachToStatementList(node.body, pool);
            break;
        case 'IfStatement':
            _attachToStatementList(node.consequent, pool);
            if (Array.isArray(node.alternate)) {
                _attachToStatementList(node.alternate, pool);
            } else if (node.alternate) {
                _recurseIntoNode(node.alternate, pool);
            }
            break;
        case 'GuardStatement':
            _attachToStatementList(node.alternate, pool);
            break;
        case 'WhileStatement':
        case 'ForStatement':
        case 'LoopStatement':
            _attachToStatementList(node.body, pool);
            break;
        case 'TryStatement':
            _attachToStatementList(node.tryBlock, pool);
            _attachToStatementList(node.catchBlock, pool);
            break;
        case 'MatchStatement':
            for (const c of (node.cases ?? [])) {
                _attachToStatementList(c.consequent, pool);
            }
            break;
        case 'LabeledStatement':
            if (node.statement) _recurseIntoNode(node.statement, pool);
            break;
        default:
            break;
    }
}
