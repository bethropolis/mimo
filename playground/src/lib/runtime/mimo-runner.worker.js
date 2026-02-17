const WORKSPACE_ROOT = '/home/workspace';

/** @type {Promise<any> | null} */
let bundlePromise = null;

/** @returns {Promise<any>} */
function getBundle() {
	if (!bundlePromise) {
		const bundlePath = '/mimo-web.bundle.js';
		bundlePromise = import(/* @vite-ignore */ bundlePath);
	}
	return bundlePromise;
}

/** @param {string} input */
function normalizeSlashes(input) {
	return String(input || '').replace(/\\/g, '/').replace(/\/+/g, '/');
}

/** @param {string} filePath */
function toWorkspaceRelative(filePath) {
	let path = normalizeSlashes(filePath).trim();
	if (!path) return '';
	if (path.startsWith(WORKSPACE_ROOT)) {
		path = path.slice(WORKSPACE_ROOT.length);
	}
	if (path.startsWith('/')) path = path.slice(1);
	if (path.endsWith('/')) path = path.slice(0, -1);
	const parts = path.split('/');
	/** @type {string[]} */
	const resolved = [];
	for (const part of parts) {
		if (!part || part === '.') continue;
		if (part === '..') {
			if (resolved.length) resolved.pop();
			continue;
		}
		resolved.push(part);
	}
	return resolved.join('/');
}

/** @param {Record<string, string>} sourceFiles */
function createVirtualWorkspace(sourceFiles) {
	/** @type {Map<string, string>} */
	const files = new Map();
	/** @type {Set<string>} */
	const dirs = new Set(['']);

	/** @param {string} dirPath */
	function ensureDir(dirPath) {
		let current = '';
		const parts = toWorkspaceRelative(dirPath).split('/').filter(Boolean);
		for (const part of parts) {
			current = current ? `${current}/${part}` : part;
			dirs.add(current);
		}
	}

	for (const [path, content] of Object.entries(sourceFiles ?? {})) {
		const rel = toWorkspaceRelative(path);
		if (!rel) continue;
		files.set(rel, String(content));
		const parentParts = rel.split('/');
		parentParts.pop();
		ensureDir(parentParts.join('/'));
	}

	/** @param {string} filePath */
	function existsSync(filePath) {
		const rel = toWorkspaceRelative(filePath);
		return rel === '' || files.has(rel) || dirs.has(rel);
	}

	/** @param {string} filePath */
	function readFileSync(filePath) {
		const rel = toWorkspaceRelative(filePath);
		if (!files.has(rel)) {
			throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
		}
		return files.get(rel);
	}

	/** @param {string} filePath @param {unknown} data */
	function writeFileSync(filePath, data) {
		const rel = toWorkspaceRelative(filePath);
		const parent = rel.split('/');
		parent.pop();
		ensureDir(parent.join('/'));
		files.set(rel, String(data ?? ''));
	}

	/** @param {string} dirPath */
	function mkdirSync(dirPath) {
		ensureDir(dirPath);
	}

	/** @param {string} dirPath */
	function readdirSync(dirPath) {
		const relDir = toWorkspaceRelative(dirPath);
		const prefix = relDir ? `${relDir}/` : '';
		/** @type {Set<string>} */
		const names = new Set();

		for (const dir of dirs) {
			if (!dir.startsWith(prefix) || dir === relDir) continue;
			const rest = dir.slice(prefix.length);
			const name = rest.split('/')[0];
			if (name) names.add(name);
		}
		for (const file of files.keys()) {
			if (!file.startsWith(prefix)) continue;
			const rest = file.slice(prefix.length);
			const name = rest.split('/')[0];
			if (name) names.add(name);
		}
		return [...names];
	}

	/** @param {string} filePath */
	function unlinkSync(filePath) {
		const rel = toWorkspaceRelative(filePath);
		files.delete(rel);
	}

	/** @param {string} dirPath */
	function rmdirSync(dirPath) {
		const rel = toWorkspaceRelative(dirPath);
		if (!rel) return;
		const prefix = `${rel}/`;
		for (const dir of dirs) {
			if (dir.startsWith(prefix)) return;
		}
		for (const file of files.keys()) {
			if (file.startsWith(prefix)) return;
		}
		dirs.delete(rel);
	}

	/** @param {string} pathId @param {{ recursive?: boolean; force?: boolean }} [options] */
	function rmSync(pathId, options = {}) {
		const rel = toWorkspaceRelative(pathId);
		if (!rel) return;

		if (files.has(rel)) {
			files.delete(rel);
			return;
		}

		const prefix = `${rel}/`;
		if (!options.recursive) {
			for (const dir of dirs) {
				if (dir.startsWith(prefix)) throw new Error(`ENOTEMPTY: directory not empty, rmdir '${pathId}'`);
			}
			for (const file of files.keys()) {
				if (file.startsWith(prefix)) throw new Error(`ENOTEMPTY: directory not empty, rmdir '${pathId}'`);
			}
		}

		for (const file of [...files.keys()]) {
			if (file === rel || file.startsWith(prefix)) files.delete(file);
		}
		for (const dir of [...dirs]) {
			if (dir === rel || dir.startsWith(prefix)) dirs.delete(dir);
		}
	}

	return {
		readFileSync,
		writeFileSync,
		existsSync,
		readdirSync,
		mkdirSync,
		unlinkSync,
		rmdirSync,
		rmSync,
		snapshot() {
			/** @type {Record<string, string>} */
			const out = {};
			for (const [path, content] of files.entries()) {
				out[path] = content;
			}
			return out;
		}
	};
}

self.onmessage = async (event) => {
	const data = event.data;
	if (!data || data.type !== 'run') return;

	const { id, source, filePath, files } = data;
	try {
		const mod = await getBundle();
		const Mimo = mod.Mimo;
		const browserAdapter = mod.createBrowserAdapter ? mod.createBrowserAdapter() : mod.browserAdapter;
		if (!Mimo || !browserAdapter) {
			throw new Error('Bundle exports are missing. Run `bun run bundles` in playground/.');
		}

		const workspace = createVirtualWorkspace(files);
		/** @type {string[]} */
		const logs = [];
		const adapter = {
			...browserAdapter,
			...workspace,
			/** @param {...unknown} args */
			log: (...args) => logs.push(args.join(' ')),
			/** @param {...unknown} args */
			error: (...args) => logs.push(`ERROR: ${args.join(' ')}`)
		};

		const mimo = new Mimo(adapter);
		const result = mimo.run(source, filePath);

		/** @type {string[]} */
		const output = [...logs];
		if (result !== undefined && result !== null) output.push(`Result: ${String(result)}`);
		if (output.length === 0) output.push('Program finished with no output.');

		self.postMessage({
			type: 'run:ok',
			id,
			output,
			files: workspace.snapshot()
		});
	} catch (error) {
		self.postMessage({
			type: 'run:error',
			id,
			error: String(error)
		});
	}
};
