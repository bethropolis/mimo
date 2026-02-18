/**
 * Playground store - centralized state management using Svelte 5 runes
 */

import { getContext, setContext } from 'svelte';
import {
	initZenFS,
	isIndexedDBActive,
	seedWorkspaceFiles,
	readWorkspaceFile,
	writeWorkspaceFile,
	workspaceExists,
	workspaceIsDirectory,
	createWorkspaceFolder,
	renameWorkspacePath,
	deleteWorkspacePath,
	createZenFSBrowserAdapter
} from '$lib/runtime/zenfs.js';
import { createZipBlob } from '$lib/runtime/zip.js';
import { createRunner } from '$lib/runtime/runner.svelte.js';
import { normalizeAst } from '$lib/utils/ast.js';
import { encodeShareBase64, decodeShareBase64, sanitizeSharedPath } from '$lib/utils/share.js';
import { parentPath, firstAvailableFileId, buildTreeFromFs, snapshotWorkspaceFiles } from '$lib/utils/workspace.js';

const PLAYGROUND_CONTEXT = Symbol('playground');

/** @type {Record<string, string>} */
const DEFAULT_FILE_CONTENTS = {
	'src/main.mimo': `import "modules/math.mimo" as math\n\nfunction bootstrap(name)\n  set score call math.double(21)\n  show + "hello, " name\n  show + "score=" score\n  return score\nend\n\ncall bootstrap("developer") -> result\nshow result`,
	'src/app.mimo': `function greet(person)\n  return + "Welcome " person\nend\n\ncall greet("Mimo") -> banner\nshow banner`,
	'modules/math.mimo': `export function double(value)\n  return * value 2\nend\n\nexport function sum(a, b)\n  return + a b\nend`,
	'modules/strings.mimo': `export function loud(text)\n  return + text "!"\nend`
};

function timestamp() {
	return new Date().toLocaleTimeString('en-US', { hour12: false });
}

export function createPlaygroundStore() {
	// Explorer state
	let tree = $state(/** @type {import('$lib/utils/workspace.js').ExplorerNode[]} */ ([]));
	let selectedNodeId = $state('src/main.mimo');

	// Editor state
	let tabs = $state([
		{ id: 'src/main.mimo', name: 'main.mimo', content: DEFAULT_FILE_CONTENTS['src/main.mimo'] },
		{ id: 'modules/math.mimo', name: 'math.mimo', content: DEFAULT_FILE_CONTENTS['modules/math.mimo'] }
	]);
	let activeTabId = $state('src/main.mimo');

	// Theme settings
	let theme = $state('system');
	let fontSize = $state(14);
	let tabSize = $state(2);
	let autoSave = $state(true);

	// System theme detection
	let prefersDark = $state(false);
	$effect(() => {
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const apply = () => (prefersDark = media.matches);
		apply();
		media.addEventListener('change', apply);
		return () => media.removeEventListener('change', apply);
	});

	let resolvedTheme = $derived(theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme);

	// UI state
	let sidebarOpen = $state(true);
	let settingsOpen = $state(false);
	let shareOpen = $state(false);
	let fsStatus = $state('initializing');
	let shareLink = $state('');
	let shareLinkError = $state('');

	// Split ratios
	let sidebarRatio = $state(23);
	let workspaceRatio = $state(64);
	let centerRatio = $state(66);
	let rightRatio = $state(52);

	// Output state
	let outputLines = $state(['Mimo playground ready.']);
	let errors = $state(/** @type {string[]} */ ([]));
	let warnings = $state(['Imports are shown as static samples in this mock project tree.']);
	let terminalLogs = $state([
		{ time: timestamp(), level: 'info', message: 'Boot sequence complete.' },
		{ time: timestamp(), level: 'warning', message: 'Filesystem modules are mocked in browser mode.' }
	]);

	// AST state
	let astData = $state(/** @type {any | null} */ (null));
	let astError = $state('');
	let astLoading = $state(false);

	// Runner
	const runner = createRunner();

	// AST parser
	/** @type {Promise<any> | null} */
	let runtimeBundlePromise = null;
	/** @type {any | null} */
	let astMimo = null;
	let astParseSeq = 0;

	async function getAstMimo() {
		if (astMimo) return astMimo;
		if (!runtimeBundlePromise) {
			const bundlePath = '/mimo-web.bundle.js';
			runtimeBundlePromise = import(/* @vite-ignore */ bundlePath);
		}
		const mod = await runtimeBundlePromise;
		const Mimo = mod.Mimo;
		const browserAdapter = mod.createBrowserAdapter ? mod.createBrowserAdapter() : mod.browserAdapter;
		if (!Mimo || !browserAdapter) {
			throw new Error('Bundle exports are missing. Run `bun run bundles` in playground/.');
		}
		astMimo = new Mimo(createZenFSBrowserAdapter(browserAdapter));
		return astMimo;
	}

	/** @param {string} source @param {string} filePath */
	async function refreshAst(source, filePath) {
		const seq = ++astParseSeq;
		astLoading = true;
		astError = '';
		try {
			await initZenFS();
			const mimo = await getAstMimo();
			const parsed = mimo.parseSource(source, filePath);
			if (seq !== astParseSeq) return;
			astData = normalizeAst(parsed);
		} catch (error) {
			if (seq !== astParseSeq) return;
			astData = null;
			astError = String(error);
		} finally {
			if (seq === astParseSeq) astLoading = false;
		}
	}

	// Derived values
	let activeCode = $derived(tabs.find((tab) => tab.id === activeTabId)?.content ?? '');

	// Methods
	/** @param {'info'|'success'|'error'|'warning'} level @param {string} message */
	function appendLog(level, message) {
		terminalLogs = [...terminalLogs, { time: timestamp(), level, message }];
	}

	/** @param {string} message */
	function alertActionError(message) {
		appendLog('error', message);
		alert(message);
	}

	function refreshExplorerFromFs() {
		tree = buildTreeFromFs();
	}

	/** @param {string} fileId */
	function openFile(fileId) {
		const found = tabs.find((tab) => tab.id === fileId);
		const content =
			readWorkspaceFile(fileId) ??
			DEFAULT_FILE_CONTENTS[/** @type {keyof typeof DEFAULT_FILE_CONTENTS} */ (fileId)] ??
			'// File not found';
		if (!found) {
			tabs = [
				...tabs,
				{
					id: fileId,
					name: fileId.split('/').pop() ?? fileId,
					content
				}
			];
		} else if (found.content !== content) {
			tabs = tabs.map((tab) => (tab.id === fileId ? { ...tab, content } : tab));
		}
		activeTabId = fileId;
		selectedNodeId = fileId;
	}

	/** @param {string} tabId */
	function closeTab(tabId) {
		if (tabs.length <= 1) return;
		const nextTabs = tabs.filter((tab) => tab.id !== tabId);
		tabs = nextTabs;
		if (activeTabId === tabId) {
			activeTabId = nextTabs[0].id;
		}
	}

	/** @param {string} tabId */
	function selectTab(tabId) {
		activeTabId = tabId;
	}

	/** @param {string} nextCode */
	function updateActiveCode(nextCode) {
		tabs = tabs.map((tab) => (tab.id === activeTabId ? { ...tab, content: nextCode } : tab));
		writeWorkspaceFile(activeTabId, nextCode);
	}

	/** @param {string} nodeId */
	function selectNode(nodeId) {
		selectedNodeId = nodeId;
	}

	/** @param {string} oldId @param {string} nextId */
	function updateTabsForRename(oldId, nextId) {
		tabs = tabs.map((tab) => {
			if (tab.id === oldId) {
				return { ...tab, id: nextId, name: nextId.split('/').pop() ?? nextId };
			}
			if (tab.id.startsWith(`${oldId}/`)) {
				const renamedId = `${nextId}/${tab.id.slice(oldId.length + 1)}`;
				return { ...tab, id: renamedId, name: renamedId.split('/').pop() ?? renamedId };
			}
			return tab;
		});
		if (activeTabId === oldId) activeTabId = nextId;
		else if (activeTabId.startsWith(`${oldId}/`)) activeTabId = `${nextId}/${activeTabId.slice(oldId.length + 1)}`;
		if (selectedNodeId === oldId) selectedNodeId = nextId;
		else if (selectedNodeId.startsWith(`${oldId}/`))
			selectedNodeId = `${nextId}/${selectedNodeId.slice(oldId.length + 1)}`;
	}

	/** @param {string} removedId */
	function updateTabsForDelete(removedId) {
		tabs = tabs.filter((tab) => tab.id !== removedId && !tab.id.startsWith(`${removedId}/`));
		if (!activeTabId || activeTabId === removedId || activeTabId.startsWith(`${removedId}/`)) {
			const fallback = tabs[0]?.id ?? firstAvailableFileId(tree);
			activeTabId = fallback;
			if (fallback) openFile(fallback);
		}
		if (selectedNodeId === removedId || selectedNodeId.startsWith(`${removedId}/`)) {
			selectedNodeId = activeTabId;
		}
	}

	/** @param {string} baseDirId @param {string} rawName */
	function createFile(baseDirId, rawName) {
		const folderId = baseDirId.trim();
		const name = rawName.trim().replace(/^\/+/, '');
		if (!name || name.includes('/')) {
			alertActionError('Invalid file name.');
			return false;
		}
		if (folderId && !workspaceIsDirectory(folderId)) {
			alertActionError(`Target folder does not exist: ${folderId}`);
			return false;
		}
		const fileId = folderId ? `${folderId}/${name}` : name;
		if (workspaceExists(fileId)) {
			alertActionError(`File already exists: ${fileId}`);
			return false;
		}

		try {
			writeWorkspaceFile(fileId, '');
			refreshExplorerFromFs();
			openFile(fileId);
			appendLog('success', `Created file ${fileId}`);
			return true;
		} catch (error) {
			alertActionError(`Failed to create file: ${String(error)}`);
			return false;
		}
	}

	/** @param {string} baseDirId @param {string} rawName */
	function createFolder(baseDirId, rawName) {
		const parentDir = baseDirId.trim();
		const name = rawName.trim().replace(/^\/+/, '').replace(/\/+$/, '');
		if (!name || name.includes('/')) {
			alertActionError('Invalid folder name.');
			return false;
		}
		if (parentDir && !workspaceIsDirectory(parentDir)) {
			alertActionError(`Target folder does not exist: ${parentDir}`);
			return false;
		}
		const folderId = parentDir ? `${parentDir}/${name}` : name;
		if (workspaceExists(folderId)) {
			alertActionError(`Folder already exists: ${folderId}`);
			return false;
		}

		try {
			createWorkspaceFolder(folderId);
			refreshExplorerFromFs();
			selectedNodeId = folderId;
			appendLog('success', `Created folder ${folderId}`);
			return true;
		} catch (error) {
			alertActionError(`Failed to create folder: ${String(error)}`);
			return false;
		}
	}

	/** @param {string} nodeId @param {string} rawNextName */
	function renameNode(nodeId, rawNextName) {
		const nextName = rawNextName.trim();
		if (!nodeId || !nextName || nextName.includes('/')) {
			alertActionError('Invalid rename target.');
			return false;
		}
		const parentDir = parentPath(nodeId);
		const normalized = nextName.replace(/^\/+/, '').replace(/\/+$/, '');
		const nextId = parentDir ? `${parentDir}/${normalized}` : normalized;
		if (!nextId || nodeId === nextId) return true;
		if (workspaceExists(nextId)) {
			alertActionError(`Path already exists: ${nextId}`);
			return false;
		}
		try {
			renameWorkspacePath(nodeId, nextId);
			updateTabsForRename(nodeId, nextId);
			refreshExplorerFromFs();
			selectedNodeId = nextId;
			appendLog('success', `Renamed to ${nextId}`);
			return true;
		} catch (error) {
			alertActionError(`Failed to rename: ${String(error)}`);
			return false;
		}
	}

	/** @param {string} nodeId */
	function deleteNode(nodeId) {
		if (!nodeId) return false;
		try {
			deleteWorkspacePath(nodeId, workspaceIsDirectory(nodeId));
			updateTabsForDelete(nodeId);
			refreshExplorerFromFs();
			selectedNodeId = activeTabId;
			appendLog('warning', `Deleted ${nodeId}`);
			return true;
		} catch (error) {
			alertActionError(`Failed to delete: ${String(error)}`);
			return false;
		}
	}

	async function runActive() {
		await initZenFS();
		appendLog('info', `Running ${activeTabId}`);

		try {
			const workerResult = await runner.runInWorker({
				source: activeCode,
				filePath: `/${activeTabId}`,
				files: snapshotWorkspaceFiles()
			});
			outputLines = workerResult.output ?? ['Program finished with no output.'];
			errors = [];

			if (workerResult.files && typeof workerResult.files === 'object') {
				for (const [path, content] of Object.entries(workerResult.files)) {
					writeWorkspaceFile(path, String(content ?? ''));
				}
				tabs = tabs.map((tab) => ({
					...tab,
					content: readWorkspaceFile(tab.id) ?? tab.content
				}));
			}
			appendLog('success', 'Execution completed.');
		} catch (error) {
			const message = String(error);
			errors = [message];
			appendLog('error', message);
		} finally {
			refreshExplorerFromFs();
		}
	}

	/** @param {string} command */
	function runCommand(command) {
		const next = command.trim();
		if (!next) return;
		appendLog('info', `> ${next}`);
		if (next === 'clear') {
			terminalLogs = [];
		} else if (next === 'clear output') {
			outputLines = [];
		} else if (next === 'clear errors') {
			errors = [];
		} else if (next === 'clear warnings') {
			warnings = [];
		} else if (next.includes('run')) {
			runActive();
		} else {
			appendLog('warning', 'Unknown command. Try: run src/main.mimo or clear');
		}
	}

	function clearTerminalLogs() {
		terminalLogs = [];
	}

	/** @param {'output'|'errors'|'warnings'} tab */
	function clearOutputTab(tab) {
		if (tab === 'errors') errors = [];
		else if (tab === 'warnings') warnings = [];
		else outputLines = [];
	}

	async function shareWorkspace() {
		shareOpen = true;
		shareLinkError = '';
	}

	function downloadWorkspaceZip() {
		try {
			const files = snapshotWorkspaceFiles();
			const blob = createZipBlob(files);
			const url = URL.createObjectURL(blob);
			const anchor = document.createElement('a');
			anchor.href = url;
			anchor.download = 'mimo-workspace.zip';
			anchor.click();
			URL.revokeObjectURL(url);
			appendLog('success', 'Workspace ZIP download started.');
		} catch (error) {
			const message = `Failed to build ZIP: ${String(error)}`;
			appendLog('error', message);
			alert(message);
		}
	}

	function generateShareLink() {
		try {
			const content = readWorkspaceFile(activeTabId) ?? activeCode;
			const encoded = encodeShareBase64(content ?? '');
			const url = new URL(location.href);
			url.searchParams.set('file', activeTabId);
			url.searchParams.set('code', encoded);
			shareLink = url.toString();
			shareLinkError = '';
			appendLog('success', `Share link generated for ${activeTabId}`);
		} catch (error) {
			shareLink = '';
			shareLinkError = String(error);
			appendLog('error', `Failed to generate share link: ${String(error)}`);
			alert(`Failed to generate share link: ${String(error)}`);
		}
	}

	async function copyShareLink() {
		if (!shareLink) return;
		try {
			await navigator.clipboard.writeText(shareLink);
			appendLog('success', 'Share link copied to clipboard.');
		} catch (error) {
			appendLog('warning', `Copy failed. ${String(error)}`);
			alert(`Failed to copy link: ${String(error)}`);
		}
	}

	async function initialize() {
		await initZenFS();
		seedWorkspaceFiles(DEFAULT_FILE_CONTENTS);

		const params = new URLSearchParams(location.search);
		const codeParam = params.get('code');
		if (codeParam) {
			try {
				const decoded = decodeShareBase64(codeParam);
				const targetPath = sanitizeSharedPath(params.get('file') ?? 'shared/shared.mimo');
				writeWorkspaceFile(targetPath, decoded);
				if (!tabs.some((tab) => tab.id === targetPath)) {
					tabs = [...tabs, { id: targetPath, name: targetPath.split('/').pop() ?? targetPath, content: decoded }];
				}
				activeTabId = targetPath;
				selectedNodeId = targetPath;
				appendLog('success', `Loaded shared file from URL: ${targetPath}`);
			} catch (error) {
				appendLog('error', `Failed to decode shared file: ${String(error)}`);
				alert(`Failed to decode shared link: ${String(error)}`);
			}
		}

		refreshExplorerFromFs();

		tabs = tabs.map((tab) => ({
			...tab,
			content: readWorkspaceFile(tab.id) ?? tab.content
		}));
		if (!workspaceExists(activeTabId)) {
			const fallback = firstAvailableFileId(tree);
			if (fallback) openFile(fallback);
		}

		fsStatus = isIndexedDBActive() ? 'indexeddb' : 'memory';
		appendLog(
			fsStatus === 'indexeddb' ? 'success' : 'warning',
			fsStatus === 'indexeddb'
				? 'Filesystem online (IndexedDB mounted at /home).'
				: 'Filesystem online in in-memory fallback mode.'
		);
		await refreshAst(activeCode, `/${activeTabId}`);
	}

	function destroy() {
		runner.terminate();
	}

	// Effect to refresh AST when code changes
	$effect(() => {
		const code = activeCode;
		const fileId = activeTabId;
		const timer = setTimeout(() => {
			refreshAst(code, `/${fileId}`);
		}, 180);
		return () => clearTimeout(timer);
	});

	return {
		// State
		get tree() { return tree; },
		get selectedNodeId() { return selectedNodeId; },
		get tabs() { return tabs; },
		get activeTabId() { return activeTabId; },
		get activeCode() { return activeCode; },
		get theme() { return theme; },
		set theme(v) { theme = v; },
		get fontSize() { return fontSize; },
		set fontSize(v) { fontSize = v; },
		get tabSize() { return tabSize; },
		set tabSize(v) { tabSize = v; },
		get autoSave() { return autoSave; },
		set autoSave(v) { autoSave = v; },
		get resolvedTheme() { return resolvedTheme; },
		get sidebarOpen() { return sidebarOpen; },
		set sidebarOpen(v) { sidebarOpen = v; },
		get settingsOpen() { return settingsOpen; },
		set settingsOpen(v) { settingsOpen = v; },
		get shareOpen() { return shareOpen; },
		set shareOpen(v) { shareOpen = v; },
		get fsStatus() { return fsStatus; },
		get shareLink() { return shareLink; },
		get shareLinkError() { return shareLinkError; },
		get sidebarRatio() { return sidebarRatio; },
		set sidebarRatio(v) { sidebarRatio = v; },
		get workspaceRatio() { return workspaceRatio; },
		set workspaceRatio(v) { workspaceRatio = v; },
		get centerRatio() { return centerRatio; },
		set centerRatio(v) { centerRatio = v; },
		get rightRatio() { return rightRatio; },
		set rightRatio(v) { rightRatio = v; },
		get outputLines() { return outputLines; },
		get errors() { return errors; },
		get warnings() { return warnings; },
		get terminalLogs() { return terminalLogs; },
		get astData() { return astData; },
		get astError() { return astError; },
		get astLoading() { return astLoading; },

		// Methods
		initialize,
		destroy,
		openFile,
		closeTab,
		selectTab,
		updateActiveCode,
		selectNode,
		createFile,
		createFolder,
		renameNode,
		deleteNode,
		runActive,
		runCommand,
		clearTerminalLogs,
		clearOutputTab,
		shareWorkspace,
		downloadWorkspaceZip,
		generateShareLink,
		copyShareLink,
		appendLog
	};
}

/** @param {ReturnType<typeof createPlaygroundStore>} store */
export function setPlaygroundContext(store) {
	setContext(PLAYGROUND_CONTEXT, store);
}

export function getPlaygroundContext() {
	return getContext(PLAYGROUND_CONTEXT);
}
