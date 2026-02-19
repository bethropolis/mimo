import { configure, InMemory, fs as zenfs } from '@zenfs/core';
const WORKSPACE_ROOT = '/home/workspace';

let usingIndexedDB = false;
/** @type {Promise<void> | null} */
let initPromise = null;

/** @param {string} filePath */
function normalize(filePath) {
	const safe = String(filePath || '/');
	if (safe.startsWith('/')) return safe;
	return `/${safe}`;
}

/** @param {string} filePath */
function ensureDirForFile(filePath) {
	const normalized = normalize(filePath);
	const lastSlash = normalized.lastIndexOf('/');
	const dir = lastSlash <= 0 ? '/' : normalized.slice(0, lastSlash);
	if (!zenfs.existsSync(dir)) {
		zenfs.mkdirSync(dir, { recursive: true });
	}
}

export async function initZenFS() {
	if (initPromise) return initPromise;

	initPromise = (async () => {
		try {
			const domModule = await import('@zenfs/dom');
			const IndexedDB = domModule.IndexedDB;

			await configure({
				mounts: {
					'/': InMemory,
					'/tmp': InMemory,
					'/home': IndexedDB
				}
			});
			usingIndexedDB = true;
		} catch (error) {
			console.warn('ZenFS IndexedDB backend unavailable, falling back to InMemory.', error);
			await configure({
				mounts: {
					'/': InMemory,
					'/tmp': InMemory,
					'/home': InMemory
				}
			});
			usingIndexedDB = false;
		}

		if (!zenfs.existsSync(WORKSPACE_ROOT)) {
			zenfs.mkdirSync(WORKSPACE_ROOT, { recursive: true });
		}
	})();

	return initPromise;
}

export function isIndexedDBActive() {
	return usingIndexedDB;
}

/** @param {string} fileId */
export function workspacePath(fileId) {
	return normalize(`${WORKSPACE_ROOT}/${fileId}`);
}

/** Check if workspace has any files */
export function isWorkspaceEmpty() {
	if (!zenfs.existsSync(WORKSPACE_ROOT)) return true;
	const entries = zenfs.readdirSync(WORKSPACE_ROOT);
	return entries.length === 0;
}

/** Clear all files in workspace */
export function clearWorkspace() {
	if (zenfs.existsSync(WORKSPACE_ROOT)) {
		zenfs.rmSync(WORKSPACE_ROOT, { recursive: true, force: true });
	}
	zenfs.mkdirSync(WORKSPACE_ROOT, { recursive: true });
}

/** @param {Record<string, string>} seedFiles */
export function seedWorkspaceFiles(seedFiles) {
	for (const [fileId, content] of Object.entries(seedFiles)) {
		const fullPath = workspacePath(fileId);
		if (!zenfs.existsSync(fullPath)) {
			ensureDirForFile(fullPath);
			zenfs.writeFileSync(fullPath, content, { encoding: 'utf-8' });
		}
	}
}

/** @param {Record<string, string>} files - files to write (will replace entire workspace) */
export function replaceWorkspaceFiles(files) {
	clearWorkspace();
	for (const [fileId, content] of Object.entries(files)) {
		const fullPath = workspacePath(fileId);
		ensureDirForFile(fullPath);
		zenfs.writeFileSync(fullPath, content, { encoding: 'utf-8' });
	}
}

/** @param {string} fileId */
export function readWorkspaceFile(fileId) {
	const fullPath = workspacePath(fileId);
	if (!zenfs.existsSync(fullPath)) return null;
	return zenfs.readFileSync(fullPath, { encoding: 'utf-8' });
}

/** @param {string} fileId @param {string} content */
export function writeWorkspaceFile(fileId, content) {
	const fullPath = workspacePath(fileId);
	ensureDirForFile(fullPath);
	zenfs.writeFileSync(fullPath, content, { encoding: 'utf-8' });
}

/** @param {string} pathId */
export function workspaceExists(pathId) {
	return zenfs.existsSync(workspacePath(pathId));
}

/** @param {string} pathId */
export function workspaceIsDirectory(pathId) {
	const fullPath = workspacePath(pathId);
	if (!zenfs.existsSync(fullPath)) return false;
	return zenfs.statSync(fullPath).isDirectory();
}

/** @param {string} dirId */
export function createWorkspaceFolder(dirId) {
	const fullPath = workspacePath(dirId);
	if (!zenfs.existsSync(fullPath)) {
		zenfs.mkdirSync(fullPath, { recursive: true });
	}
}

/** @param {string} [dirId] */
export function listWorkspaceEntries(dirId = '') {
	const fullPath = workspacePath(dirId);
	if (!zenfs.existsSync(fullPath)) return [];
	const names = zenfs.readdirSync(fullPath);
	return names.map((name) => {
		const entryPath = dirId ? `${dirId}/${name}` : name;
		return {
			name,
			path: entryPath,
			isDirectory: workspaceIsDirectory(entryPath)
		};
	});
}

/** @param {string} fromId @param {string} toId */
export function renameWorkspacePath(fromId, toId) {
	const fromPath = workspacePath(fromId);
	const toPath = workspacePath(toId);
	ensureDirForFile(toPath);
	zenfs.renameSync(fromPath, toPath);
}

/** @param {string} pathId @param {boolean} [recursive] */
export function deleteWorkspacePath(pathId, recursive = false) {
	const fullPath = workspacePath(pathId);
	if (!zenfs.existsSync(fullPath)) return;
	if (recursive) {
		zenfs.rmSync(fullPath, { recursive: true, force: true });
		return;
	}
	zenfs.unlinkSync(fullPath);
}

/**
 * @param {any} baseAdapter
 * @param {{ onLog?: (...args: unknown[]) => void; onError?: (...args: unknown[]) => void }} [options]
 */
export function createZenFSBrowserAdapter(baseAdapter, options = {}) {
	const onLog = options.onLog ?? ((...args) => console.log(...args));
	const onError = options.onError ?? ((...args) => console.error(...args));
	/** @param {string} filePath */
	const mapToWorkspace = (filePath) => {
		const normalized = normalize(filePath);
		if (normalized === WORKSPACE_ROOT || normalized.startsWith(`${WORKSPACE_ROOT}/`)) {
			return normalized;
		}
		if (normalized === '/') return WORKSPACE_ROOT;
		return `${WORKSPACE_ROOT}${normalized}`;
	};

	return {
		...baseAdapter,
		/** @param {string} filePath @param {string} [encoding] */
		readFileSync: (filePath, encoding = 'utf-8') =>
			zenfs.readFileSync(mapToWorkspace(filePath), /** @type {any} */ (encoding)),
		/** @param {string} filePath */
		readdirSync: (filePath) => zenfs.readdirSync(mapToWorkspace(filePath)),
		/** @param {string} filePath */
		existsSync: (filePath) => zenfs.existsSync(mapToWorkspace(filePath)),
		/** @param {string} filePath @param {any} data @param {string} [encoding] */
		writeFileSync: (filePath, data, encoding = 'utf-8') => {
			const fullPath = mapToWorkspace(filePath);
			ensureDirForFile(fullPath);
			zenfs.writeFileSync(fullPath, data, /** @type {any} */ (encoding));
		},
		/** @param {string} filePath @param {any} [optionsArg] */
		mkdirSync: (filePath, optionsArg = { recursive: true }) => {
			const fullPath = mapToWorkspace(filePath);
			if (!zenfs.existsSync(fullPath)) zenfs.mkdirSync(fullPath, optionsArg);
		},
		/** @param {string} filePath */
		unlinkSync: (filePath) => zenfs.unlinkSync(mapToWorkspace(filePath)),
		/** @param {string} filePath */
		rmdirSync: (filePath) => zenfs.rmdirSync(mapToWorkspace(filePath)),
		/** @param {string} filePath @param {any} [optionsArg] */
		rmSync: (filePath, optionsArg = { recursive: true, force: true }) =>
			zenfs.rmSync(mapToWorkspace(filePath), optionsArg),
		/** @param {...unknown} args */
		log: (...args) => onLog(...args),
		/** @param {...unknown} args */
		error: (...args) => onError(...args)
	};
}
