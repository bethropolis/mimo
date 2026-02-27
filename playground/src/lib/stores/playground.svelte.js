/**
 * Playground store - centralized state management using Svelte 5 runes
 */

import { getContext, setContext } from 'svelte';
import {
	initZenFS,
	isIndexedDBActive,
	isWorkspaceEmpty,
	seedWorkspaceFiles,
	replaceWorkspaceFiles,
	readWorkspaceFile,
	writeWorkspaceFile,
	workspaceExists,
	workspaceIsDirectory,
	createWorkspaceFolder,
	renameWorkspacePath,
	deleteWorkspacePath,
	createZenFSBrowserAdapter,
	workspacePath,
	listWorkspaceEntries
} from '$lib/runtime/zenfs.js';
import { createZipBlob, extractZipBlob } from '$lib/runtime/zip.js';
import { createRunner } from '$lib/runtime/runner.svelte.js';
import { normalizeAst } from '$lib/utils/ast.js';
import { encodeShareBase64, decodeShareBase64, sanitizeSharedPath } from '$lib/utils/share.js';
import { parentPath, firstAvailableFileId, buildTreeFromFs, snapshotWorkspaceFiles } from '$lib/utils/workspace.js';
import { DEFAULT_FILE_CONTENTS, DEFAULT_TABS, DEFAULT_ACTIVE_TAB } from '$lib/utils/workspace-setup.js';
import { executeCommand, getCommandSuggestions } from '$lib/terminal/commands.js';
import { formatCommand, formatOutput, formatError, formatSystem, createEntry } from '$lib/terminal/formatter.js';

/**
 * @typedef {'system'|'dark'|'light'} PlaygroundTheme
 */

/**
 * @typedef {{
 * 	theme: PlaygroundTheme;
 * 	fontSize: number;
 * 	tabSize: number;
 * 	autoSave: boolean;
 * 	lintEnabled: boolean;
 * }} PersistedSettings
 */

/**
 * @typedef {{
 * 	sidebarOpen: boolean;
 * 	sidebarRatio: number;
 * 	workspaceRatio: number;
 * 	centerRatio: number;
 * 	rightRatio: number;
 * }} PersistedLayout
 */

const PLAYGROUND_CONTEXT = Symbol('playground');
const SETTINGS_STORAGE_KEY = 'mimo.playground.settings.v1';
const LAYOUT_STORAGE_KEY = 'mimo.playground.layout.v1';
/** @type {PersistedSettings} */
const DEFAULT_SETTINGS = {
	theme: 'system',
	fontSize: 14,
	tabSize: 2,
	autoSave: true,
	lintEnabled: true
};
/** @type {PersistedLayout} */
const DEFAULT_LAYOUT = {
	sidebarOpen: true,
	sidebarRatio: 23,
	workspaceRatio: 64,
	centerRatio: 66,
	rightRatio: 52
};

/**
 * @param {unknown} value
 * @returns {PlaygroundTheme}
 */
function normalizeTheme(value) {
	return value === 'dark' || value === 'light' || value === 'system' ? value : 'system';
}

/**
 * @param {unknown} value
 * @param {number} fallback
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function normalizeNumber(value, fallback, min, max) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.min(max, Math.max(min, Math.round(parsed)));
}

/**
 * @param {unknown} value
 * @param {boolean} fallback
 * @returns {boolean}
 */
function normalizeBoolean(value, fallback) {
	if (typeof value === 'boolean') return value;
	return fallback;
}

/**
 * @param {unknown} value
 * @param {number} fallback
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function normalizeRatio(value, fallback, min, max) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.min(max, Math.max(min, parsed));
}

/**
 * @returns {PersistedSettings}
 */
function loadPersistedSettings() {
	try {
		const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
		if (!raw) return { ...DEFAULT_SETTINGS };
		const parsed = JSON.parse(raw);
		return {
			theme: normalizeTheme(parsed?.theme),
			fontSize: normalizeNumber(parsed?.fontSize, DEFAULT_SETTINGS.fontSize, 12, 20),
			tabSize: normalizeNumber(parsed?.tabSize, DEFAULT_SETTINGS.tabSize, 1, 8),
			autoSave: normalizeBoolean(parsed?.autoSave, DEFAULT_SETTINGS.autoSave),
			lintEnabled: normalizeBoolean(parsed?.lintEnabled, DEFAULT_SETTINGS.lintEnabled)
		};
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
}

/**
 * @returns {PersistedLayout}
 */
function loadPersistedLayout() {
	try {
		const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
		if (!raw) return { ...DEFAULT_LAYOUT };
		const parsed = JSON.parse(raw);
		return {
			sidebarOpen: normalizeBoolean(parsed?.sidebarOpen, DEFAULT_LAYOUT.sidebarOpen),
			sidebarRatio: normalizeRatio(parsed?.sidebarRatio, DEFAULT_LAYOUT.sidebarRatio, 14, 35),
			workspaceRatio: normalizeRatio(parsed?.workspaceRatio, DEFAULT_LAYOUT.workspaceRatio, 45, 80),
			centerRatio: normalizeRatio(parsed?.centerRatio, DEFAULT_LAYOUT.centerRatio, 45, 80),
			rightRatio: normalizeRatio(parsed?.rightRatio, DEFAULT_LAYOUT.rightRatio, 30, 70)
		};
	} catch {
		return { ...DEFAULT_LAYOUT };
	}
}

/**
 * @param {PersistedSettings} settings
 */
function persistSettings(settings) {
	try {
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// Ignore persistence failures (private mode/quota/etc).
	}
}

/**
 * @param {PersistedLayout} layout
 */
function persistLayout(layout) {
	try {
		localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
	} catch {
		// Ignore persistence failures.
	}
}

function localTimestamp() {
	return new Date().toLocaleTimeString('en-US', { hour12: false });
}

export function createPlaygroundStore() {
	const persistedSettings = loadPersistedSettings();
	const persistedLayout = loadPersistedLayout();

	// Explorer state
	let tree = $state(/** @type {import('$lib/utils/workspace.js').ExplorerNode[]} */ ([]));
	let selectedNodeId = $state(DEFAULT_ACTIVE_TAB);

	// Editor state - start with empty tabs, will be populated during initialize
	let tabs = $state(/** @type {Array<{ id: string; name: string; content: string }>} */([]));
	let activeTabId = $state(DEFAULT_ACTIVE_TAB);
	let editorSelection = $state(/** @type {{ line: number, column: number } | null} */ (null));
	let recentFiles = $state(/** @type {string[]} */ ([]));

	// Theme settings
	let theme = $state(persistedSettings.theme);
	let fontSize = $state(persistedSettings.fontSize);
	let tabSize = $state(persistedSettings.tabSize);
	let autoSave = $state(persistedSettings.autoSave);

	// Lint settings
	let lintEnabled = $state(persistedSettings.lintEnabled);
	let lintMessages = $state(/** @type {Array<{ line: number; column: number; endColumn: number; message: string; ruleId: string; severity: string }>} */ ([]));

	$effect(() => {
		persistSettings({
			theme: normalizeTheme(theme),
			fontSize: normalizeNumber(fontSize, DEFAULT_SETTINGS.fontSize, 12, 20),
			tabSize: normalizeNumber(tabSize, DEFAULT_SETTINGS.tabSize, 1, 8),
			autoSave: normalizeBoolean(autoSave, DEFAULT_SETTINGS.autoSave),
			lintEnabled: normalizeBoolean(lintEnabled, DEFAULT_SETTINGS.lintEnabled)
		});
	});

	$effect(() => {
		persistLayout({
			sidebarOpen: normalizeBoolean(sidebarOpen, DEFAULT_LAYOUT.sidebarOpen),
			sidebarRatio: normalizeRatio(sidebarRatio, DEFAULT_LAYOUT.sidebarRatio, 14, 35),
			workspaceRatio: normalizeRatio(workspaceRatio, DEFAULT_LAYOUT.workspaceRatio, 45, 80),
			centerRatio: normalizeRatio(centerRatio, DEFAULT_LAYOUT.centerRatio, 45, 80),
			rightRatio: normalizeRatio(rightRatio, DEFAULT_LAYOUT.rightRatio, 30, 70)
		});
	});

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
	let sidebarOpen = $state(persistedLayout.sidebarOpen);
	let settingsOpen = $state(false);
	let shareOpen = $state(false);
	let deleteModalOpen = $state(false);
	let nodeToDelete = $state('');
	let isDeletingFolder = $state(false);
	let fsStatus = $state('initializing');
	let shareLink = $state('');
	let shareLinkError = $state('');

	// Split ratios
	let sidebarRatio = $state(persistedLayout.sidebarRatio);
	let workspaceRatio = $state(persistedLayout.workspaceRatio);
	let centerRatio = $state(persistedLayout.centerRatio);
	let rightRatio = $state(persistedLayout.rightRatio);

	// Output state
	let outputLines = $state(['Mimo playground ready.']);
	let errors = $state(/** @type {string[]} */ ([]));
	let warnings = $state(/** @type {string[]} */ ([]));
	let terminalEntries = $state(/** @type {import('$lib/terminal/formatter.js').TerminalEntry[]} */([]));

	// Terminal history for autocomplete
	let commandHistory = $state(/** @type {string[]} */([]));

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

	// Effect to lint when code changes
	$effect(() => {
		const code = activeCode;
		const fileId = activeTabId;
		const enabled = lintEnabled;
		if (!enabled || !fileId.endsWith('.mimo')) {
			lintMessages = [];
			return;
		}
		const timer = setTimeout(() => {
			lintActive();
		}, 300);
		return () => clearTimeout(timer);
	});

	// Methods
	/** @param {'info'|'success'|'error'|'warning'|'system'} level @param {string} message */
	function appendLog(level, message) {
		const entry = createEntry(level, message);
		terminalEntries = [...terminalEntries.slice(-499), entry];
	}
	
	/** @param {import('$lib/terminal/formatter.js').TerminalEntry} entry */
	function addTerminalEntry(entry) {
		terminalEntries = [...terminalEntries.slice(-499), entry];
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

		// Update recent files
		recentFiles = [fileId, ...recentFiles.filter((id) => id !== fileId)].slice(0, 10);

		// Refresh AST on open if it's a mimo file
		if (fileId.endsWith('.mimo')) {
			refreshAst(content, `/${fileId}`);
		}
	}

	function clearRecentFiles() {
		recentFiles = [];
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
		if (!nodeId) return;
		nodeToDelete = nodeId;
		isDeletingFolder = workspaceIsDirectory(nodeId);
		deleteModalOpen = true;
	}

	/** @param {string} nodeId */
	function confirmDelete(nodeId) {
		try {
			deleteWorkspacePath(nodeId, workspaceIsDirectory(nodeId));
			updateTabsForDelete(nodeId);
			refreshExplorerFromFs();
			selectedNodeId = activeTabId;
			appendLog('warning', `Deleted ${nodeId}`);
			deleteModalOpen = false;
			nodeToDelete = '';
			return true;
		} catch (error) {
			alertActionError(`Failed to delete: ${String(error)}`);
			return false;
		}
	}

	async function runActive() {
		await initZenFS();
		appendLog('info', `Running ${activeTabId}`);

		// Refresh AST on run
		if (activeTabId.endsWith('.mimo')) {
			await refreshAst(activeCode, `/${activeTabId}`);
		}

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

	async function lintActive() {
		if (!lintEnabled || !activeTabId.endsWith('.mimo')) {
			lintMessages = [];
			return;
		}
		try {
			const result = await runner.lintInWorker({
				source: activeCode,
				filePath: `/${activeTabId}`
			});
			lintMessages = result.messages ?? [];
		} catch (error) {
			lintMessages = [];
		}
	}

	async function formatActive() {
		if (!activeTabId.endsWith('.mimo')) return false;
		try {
			const result = await runner.formatInWorker({
				source: activeCode
			});
			if (result.formatted !== undefined && result.formatted !== activeCode) {
				updateActiveCode(result.formatted);
				appendLog('success', 'Code formatted.');
				return true;
			}
			return false;
		} catch (error) {
			appendLog('error', `Format error: ${String(error)}`);
			return false;
		}
	}

	/** @param {string} command */
	async function runCommand(command) {
		const next = command.trim();
		if (!next) return;
		
		// Add to history
		commandHistory = [next, ...commandHistory.filter(/** @param {string} c */(c) => c !== next)].slice(0, 50);
		
		// Show command in terminal
		addTerminalEntry(formatCommand(next));
		
		// Build command context
		/** @type {import('$lib/terminal/commands.js').CommandContext} */
		const context = {
			fs: {
				/** @param {string} path */
				readFile: (path) => readWorkspaceFile(path),
				/** @param {string} path @param {string} content */
				writeFile: (path, content) => writeWorkspaceFile(path, content),
				/** @param {string} path */
				exists: (path) => workspaceExists(path),
				/** @param {string} path */
				isDirectory: (path) => workspaceIsDirectory(path),
				/** @param {string} path */
				listDir: (path) => listWorkspaceEntries(path),
				pwd: () => '/'
			},
			runner: {
				/** @param {string} source */
				eval: async (source) => {
					return runner.evalInWorker({ source, files: snapshotWorkspaceFiles() });
				},
				/** @param {string} file */
				run: async (file) => {
					await runActive();
				}
			},
			workspace: {
				snapshot: () => snapshotWorkspaceFiles(),
				activeFile: activeTabId
			},
			terminal: {
				clear: () => { terminalEntries = []; },
				/** @param {'info'|'success'|'error'|'warning'|'system'} level @param {string} msg */
				log: (level, msg) => addTerminalEntry(createEntry(level, msg))
			}
		};
		
		try {
			const result = await executeCommand(next, context);
			
			if (result.clear) {
				terminalEntries = [];
			} else if (result.output?.length) {
				addTerminalEntry(formatOutput(result.output, result.level || 'output'));
			}
		} catch (error) {
			addTerminalEntry(formatError(/** @type {Error|string} */(error)));
		}
	}
	
	/** @param {string} partial */
	function getTerminalSuggestions(partial) {
		return getCommandSuggestions(partial);
	}

	function clearTerminalLogs() {
		terminalEntries = [];
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

	/** @param {File} file */
	async function uploadWorkspaceZip(file) {
		try {
			appendLog('info', 'Uploading workspace ZIP...');
			const files = await extractZipBlob(file);
			
			if (Object.keys(files).length === 0) {
				appendLog('warning', 'ZIP file is empty.');
				return false;
			}
			
			// Replace entire workspace
			replaceWorkspaceFiles(files);
			
			// Reset tabs to show first file
			refreshExplorerFromFs();
			
			const firstFile = firstAvailableFileId(tree);
			if (firstFile) {
				tabs = [{ id: firstFile, name: firstFile.split('/').pop() ?? firstFile, content: readWorkspaceFile(firstFile) ?? '' }];
				activeTabId = firstFile;
				selectedNodeId = firstFile;
			} else {
				tabs = [];
				activeTabId = '';
			}
			
			appendLog('success', `Workspace replaced with ${Object.keys(files).length} files from ZIP.`);
			return true;
		} catch (error) {
			const message = `Failed to extract ZIP: ${String(error)}`;
			appendLog('error', message);
			alert(message);
			return false;
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
		
		// Check if workspace is empty (first time user)
		const isEmpty = isWorkspaceEmpty();
		if (isEmpty) {
			seedWorkspaceFiles(DEFAULT_FILE_CONTENTS);
			tabs = [...DEFAULT_TABS];
			activeTabId = DEFAULT_ACTIVE_TAB;
			appendLog('info', 'Initialized default workspace.');
		}

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

		// Update tabs with actual file contents from storage
		if (tabs.length === 0) {
			// If no tabs yet, open the first available file
			const fallback = firstAvailableFileId(tree);
			if (fallback) {
				tabs = [{ id: fallback, name: fallback.split('/').pop() ?? fallback, content: readWorkspaceFile(fallback) ?? '' }];
				activeTabId = fallback;
				selectedNodeId = fallback;
			}
		} else {
			tabs = tabs.map((tab) => ({
				...tab,
				content: readWorkspaceFile(tab.id) ?? tab.content
			}));
		}
		
		if (!workspaceExists(activeTabId)) {
			const fallback = firstAvailableFileId(tree);
			if (fallback) {
				activeTabId = fallback;
				selectedNodeId = fallback;
				openFile(fallback);
			}
		}

		fsStatus = isIndexedDBActive() ? 'indexeddb' : 'memory';
		appendLog(
			fsStatus === 'indexeddb' ? 'success' : 'warning',
			fsStatus === 'indexeddb'
				? 'Filesystem online (IndexedDB mounted at /home).'
				: 'Filesystem online in in-memory fallback mode.'
		);
		
		const finalCode = tabs.find(t => t.id === activeTabId)?.content ?? activeCode;
		await refreshAst(finalCode, `/${activeTabId}`);
	}

	function destroy() {
		runner.terminate();
	}

	/** @param {number} line @param {number} column */
	function jumpToLocation(line, column) {
		editorSelection = { line, column };
		// Reset selection after a short delay to allow repeated jumps to same location
		setTimeout(() => {
			if (editorSelection?.line === line && editorSelection?.column === column) {
				editorSelection = null;
			}
		}, 100);
	}

	return {
		// State
		get tree() { return tree; },
		get selectedNodeId() { return selectedNodeId; },
		get tabs() { return tabs; },
		get activeTabId() { return activeTabId; },
		get activeCode() { return activeCode; },
		get editorSelection() { return editorSelection; },
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
		get deleteModalOpen() { return deleteModalOpen; },
		set deleteModalOpen(v) { deleteModalOpen = v; },
		get nodeToDelete() { return nodeToDelete; },
		get isDeletingFolder() { return isDeletingFolder; },
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
		get terminalEntries() { return terminalEntries; },
		get commandHistory() { return commandHistory; },
		get recentFiles() { return recentFiles; },
		get astData() { return astData; },
		get astError() { return astError; },
		get astLoading() { return astLoading; },
		get lintEnabled() { return lintEnabled; },
		set lintEnabled(v) { lintEnabled = v; },
		get lintMessages() { return lintMessages; },

		// Methods
		initialize,
		destroy,
		openFile,
		clearRecentFiles,
		closeTab,
		selectTab,
		updateActiveCode,
		selectNode,
		createFile,
		createFolder,
		renameNode,
		deleteNode,
		confirmDelete,
		runActive,
		lintActive,
		formatActive,
		runCommand,
		clearTerminalLogs,
		getTerminalSuggestions,
		clearOutputTab,
		shareWorkspace,
		downloadWorkspaceZip,
		uploadWorkspaceZip,
		generateShareLink,
		copyShareLink,
		appendLog,
		jumpToLocation
	};
}

/** @param {ReturnType<typeof createPlaygroundStore>} store */
export function setPlaygroundContext(store) {
	setContext(PLAYGROUND_CONTEXT, store);
}

export function getPlaygroundContext() {
	return getContext(PLAYGROUND_CONTEXT);
}
