/**
 * Workspace utility functions for the playground
 */

import {
	listWorkspaceEntries,
	readWorkspaceFile,
	workspaceExists,
	workspaceIsDirectory
} from '$lib/runtime/zenfs.js';

/**
 * Get the parent path of a file/folder path
 * @param {string} pathId
 * @returns {string}
 */
export function parentPath(pathId) {
	if (!pathId.includes('/')) return '';
	const parts = pathId.split('/');
	parts.pop();
	return parts.join('/');
}

/**
 * Find the first available file ID in a tree
 * @param {ExplorerNode[]} [nodes]
 * @returns {string}
 */
export function firstAvailableFileId(nodes = []) {
	for (const node of nodes) {
		if (node.type === 'file') return node.id;
		const nested = firstAvailableFileId(node.children ?? []);
		if (nested) return nested;
	}
	return '';
}

/**
 * Build an explorer tree from the filesystem
 * @param {string} [dirId]
 * @returns {ExplorerNode[]}
 */
export function buildTreeFromFs(dirId = '') {
	/** @type {{ name: string; path: string; isDirectory: boolean }[]} */
	const entries = listWorkspaceEntries(dirId);
	/** @type {ExplorerNode[]} */
	const nodes = entries.map((entry) => {
		if (entry.isDirectory) {
			return {
				id: entry.path,
				name: entry.name,
				type: 'folder',
				children: buildTreeFromFs(entry.path)
			};
		}
		return {
			id: entry.path,
			name: entry.name,
			type: 'file',
			kind: entry.path.startsWith('modules/') ? 'module' : 'file'
		};
	});
	nodes.sort((a, b) => {
		if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
		return a.name.localeCompare(b.name);
	});
	return nodes;
}

/**
 * Snapshot all workspace files into a record
 * @param {string} [dirId]
 * @returns {Record<string, string>}
 */
export function snapshotWorkspaceFiles(dirId = '') {
	/** @type {Record<string, string>} */
	const files = {};
	const entries = listWorkspaceEntries(dirId);
	for (const entry of entries) {
		if (entry.isDirectory) {
			Object.assign(files, snapshotWorkspaceFiles(entry.path));
			continue;
		}
		files[entry.path] = readWorkspaceFile(entry.path) ?? '';
	}
	return files;
}

/**
 * @typedef {{
 *   id: string;
 *   name: string;
 *   type: 'folder' | 'file';
 *   kind?: 'file' | 'module';
 *   children?: ExplorerNode[];
 * }} ExplorerNode
 */
