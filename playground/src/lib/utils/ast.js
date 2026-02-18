/**
 * AST utility functions for the playground
 */

/**
 * Check if a value is an AST node
 * @param {any} value
 * @returns {value is object}
 */
export function isAstNode(value) {
	return !!value && typeof value === 'object' && typeof value.type === 'string';
}

/**
 * Create a summary string for an AST node
 * @param {any} node
 * @returns {string}
 */
export function summarizeAstNode(node) {
	const chunks = [];
	if (typeof node.name === 'string') chunks.push(`name=${node.name}`);
	if (typeof node.operator === 'string') chunks.push(`op=${node.operator}`);
	if (typeof node.kind === 'string') chunks.push(`kind=${node.kind}`);
	if (typeof node.path === 'string') chunks.push(`path=${node.path}`);
	if (typeof node.alias === 'string') chunks.push(`alias=${node.alias}`);
	if (node.params?.length) chunks.push(`params(${node.params.join(', ')})`);
	if (
		node.value !== undefined &&
		(typeof node.value === 'string' || typeof node.value === 'number' || typeof node.value === 'boolean')
	) {
		chunks.push(`value=${String(node.value)}`);
	}
	return chunks.join('  ');
}

/**
 * Convert an AST node to a view node for the AST viewer
 * @param {any} node - The AST node
 * @param {string | undefined} key - The key of this node in its parent
 * @param {string} id - Unique identifier for this node
 * @returns {{ id: string; key: string | undefined; type: string; summary: string; location: { line: number | undefined; column: number | undefined; file: string | undefined }; children: any[] }}
 */
export function toAstViewNode(node, key, id) {
	/** @type {any[]} */
	const children = [];
	const metaKeys = new Set(['type', 'line', 'column', 'start', 'length', 'file']);

	for (const [prop, val] of Object.entries(node)) {
		if (metaKeys.has(prop)) continue;
		if (Array.isArray(val)) {
			for (let idx = 0; idx < val.length; idx += 1) {
				const item = val[idx];
				if (isAstNode(item)) {
					children.push(toAstViewNode(item, `${prop}[${idx}]`, `${id}.${prop}[${idx}]`));
				}
			}
		} else if (isAstNode(val)) {
			children.push(toAstViewNode(val, prop, `${id}.${prop}`));
		}
	}

	return {
		id,
		key,
		type: node.type,
		summary: summarizeAstNode(node),
		location: {
			line: node.line,
			column: node.column,
			file: node.file
		},
		children
	};
}

/**
 * Normalize an AST for display in the viewer
 * @param {any} ast
 * @returns {{ id: string; key: string | undefined; type: string; summary: string; location: { line: number | undefined; column: number | undefined; file: string | undefined }; children: any[] } | null}
 */
export function normalizeAst(ast) {
	if (!isAstNode(ast)) return null;
	return toAstViewNode(ast, undefined, 'root');
}
