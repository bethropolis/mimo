<script>
	import { onDestroy, onMount } from 'svelte';
	import HeaderBar from '$lib/components/playground/HeaderBar.svelte';
	import SidebarExplorer from '$lib/components/playground/SidebarExplorer.svelte';
	import EditorPanel from '$lib/components/playground/EditorPanel.svelte';
	import TerminalPanel from '$lib/components/playground/TerminalPanel.svelte';
	import AstViewerPanel from '$lib/components/playground/AstViewerPanel.svelte';
	import OutputPanel from '$lib/components/playground/OutputPanel.svelte';
	import SettingsModal from '$lib/components/playground/SettingsModal.svelte';
	import ShareModal from '$lib/components/playground/ShareModal.svelte';
	import SplitPane from '$lib/components/playground/SplitPane.svelte';
	import {
		initZenFS,
		isIndexedDBActive,
		seedWorkspaceFiles,
		readWorkspaceFile,
		writeWorkspaceFile,
		workspaceExists,
		workspaceIsDirectory,
		listWorkspaceEntries,
		createWorkspaceFolder,
		renameWorkspacePath,
		deleteWorkspacePath,
		createZenFSBrowserAdapter
	} from '$lib/runtime/zenfs.js';
	import MimoRunnerWorker from '$lib/runtime/mimo-runner.worker.js?worker';
	import { createZipBlob } from '$lib/runtime/zip.js';

	/** @type {Record<string, string>} */
	const fileContents = {
		'src/main.mimo': `import "modules/math.mimo" as math\n\nfunction bootstrap(name)\n  set score call math.double(21)\n  show + "hello, " name\n  show + "score=" score\n  return score\nend\n\ncall bootstrap("developer") -> result\nshow result`,
		'src/app.mimo': `function greet(person)\n  return + "Welcome " person\nend\n\ncall greet("Mimo") -> banner\nshow banner`,
		'modules/math.mimo': `export function double(value)\n  return * value 2\nend\n\nexport function sum(a, b)\n  return + a b\nend`,
		'modules/strings.mimo': `export function loud(text)\n  return + text "!"\nend`
	};

	/**
	 * @typedef {{
	 * id: string;
	 * name: string;
	 * type: 'folder'|'file';
	 * kind?: 'file'|'module';
	 * children?: ExplorerNode[];
	 * }} ExplorerNode
	 */

	let tree = $state(/** @type {ExplorerNode[]} */ ([]));

	const mockAst = {
		type: 'Program',
		id: 'root',
		children: [
			{
				type: 'FunctionDeclaration',
				id: 'function',
				name: 'bootstrap',
				params: ['name'],
				children: [
					{
						type: 'ReturnStatement',
						id: 'return',
						children: [
							{
								type: 'BinaryExpression',
								id: 'binary',
								operator: '+',
								children: [
									{ type: 'Variable', id: 'left', name: 'score' },
									{ type: 'Variable', id: 'right', name: 'name' }
								]
							}
						]
					}
				]
			},
			{
				type: 'ImportDeclaration',
				id: 'import1',
				source: './modules/math.mimo',
				specifier: 'math'
			},
			{
				type: 'ImportDeclaration',
				id: 'import2',
				source: './modules/strings.mimo',
				specifier: '{ loud }'
			}
		]
	};

	let sidebarOpen = $state(true);
	let settingsOpen = $state(false);
	let shareOpen = $state(false);
	let fsStatus = $state('initializing');
	let shareLink = $state('');
	let shareLinkError = $state('');

	let sidebarRatio = $state(23);
	let workspaceRatio = $state(64);
	let centerRatio = $state(66);
	let rightRatio = $state(52);

	let theme = $state('system');
	let fontSize = $state(14);
	let tabSize = $state(2);
	let autoSave = $state(true);

	let prefersDark = $state(false);

	$effect(() => {
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const apply = () => (prefersDark = media.matches);
		apply();
		media.addEventListener('change', apply);
		return () => media.removeEventListener('change', apply);
	});

	let resolvedTheme = $derived(theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme);

	let tabs = $state([
		{ id: 'src/main.mimo', name: 'main.mimo', content: fileContents['src/main.mimo'] },
		{ id: 'modules/math.mimo', name: 'math.mimo', content: fileContents['modules/math.mimo'] }
	]);
	let activeTabId = $state('src/main.mimo');
	let selectedNodeId = $state('src/main.mimo');

	let outputLines = $state(['Mimo playground ready.']);
	let errors = $state(/** @type {string[]} */ ([]));
	let warnings = $state(['Imports are shown as static samples in this mock project tree.']);
	let astData = $state(/** @type {any | null} */ (null));
	let astError = $state('');
	let astLoading = $state(false);
	let terminalLogs = $state([
		{ time: timestamp(), level: 'info', message: 'Boot sequence complete.' },
		{ time: timestamp(), level: 'warning', message: 'Filesystem modules are mocked in browser mode.' }
	]);

	/** @type {Promise<any> | null} */
	let runtimeBundlePromise = null;
	/** @type {any | null} */
	let astMimo = null;
	let astParseSeq = 0;
	let runWorker = $state(/** @type {Worker | null} */ (null));
	let runRequestId = 0;
	/** @type {Map<number, { resolve: (value: any) => void; reject: (error: unknown) => void }>} */
	const runPending = new Map();

	function timestamp() {
		return new Date().toLocaleTimeString('en-US', { hour12: false });
	}

	/** @param {string} fileId */
	function openFile(fileId) {
		const found = tabs.find((tab) => tab.id === fileId);
		const content =
			readWorkspaceFile(fileId) ??
			fileContents[/** @type {keyof typeof fileContents} */ (fileId)] ??
			'# File not found';
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

	/** @param {string} pathId */
	function parentPath(pathId) {
		if (!pathId.includes('/')) return '';
		const parts = pathId.split('/');
		parts.pop();
		return parts.join('/');
	}

	/** @param {string} message */
	function alertActionError(message) {
		appendLog('error', message);
		alert(message);
	}

	/** @param {ExplorerNode[]} [nodes] @returns {string} */
	function firstAvailableFileId(nodes = tree) {
		for (const node of nodes) {
			if (node.type === 'file') return node.id;
			const nested = firstAvailableFileId(node.children ?? []);
			if (nested) return nested;
		}
		return '';
	}

	/** @param {string} [dirId] @returns {ExplorerNode[]} */
	function buildTreeFromFs(dirId = '') {
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
		nodes.sort((/** @type {ExplorerNode} */ a, /** @type {ExplorerNode} */ b) => {
			if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
			return a.name.localeCompare(b.name);
		});
		return nodes;
	}

	function refreshExplorerFromFs() {
		tree = buildTreeFromFs();
	}

	/** @param {string} text */
	function encodeShareBase64(text) {
		const bytes = new TextEncoder().encode(text);
		let binary = '';
		for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
		return btoa(binary);
	}

	/** @param {string} base64 */
	function decodeShareBase64(base64) {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
		return new TextDecoder().decode(bytes);
	}

	/** @param {string} path */
	function sanitizeSharedPath(path) {
		const normalized = String(path || '')
			.replace(/\\/g, '/')
			.replace(/^\/+/, '')
			.replace(/\/+/g, '/')
			.trim();
		if (!normalized || normalized.includes('..')) return 'shared/shared.mimo';
		return normalized;
	}

	/** @param {string} [dirId] */
	function snapshotWorkspaceFiles(dirId = '') {
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

	function ensureRunWorker() {
		if (runWorker) return runWorker;
		runWorker = new MimoRunnerWorker();
		runWorker.addEventListener('message', (event) => {
			const payload = event.data;
			if (!payload || typeof payload.id !== 'number') return;
			const pending = runPending.get(payload.id);
			if (!pending) return;
			runPending.delete(payload.id);
			if (payload.type === 'run:ok') pending.resolve(payload);
			else pending.reject(payload.error ?? 'Unknown worker error');
		});
		return runWorker;
	}

	/** @param {{ source: string; filePath: string; files: Record<string, string> }} payload */
	function runInWorker(payload) {
		const worker = ensureRunWorker();
		const id = ++runRequestId;
		return new Promise((resolve, reject) => {
			runPending.set(id, { resolve, reject });
			worker.postMessage({ type: 'run', id, ...payload });
		});
	}

	/** @param {any} value */
	function isAstNode(value) {
		return !!value && typeof value === 'object' && typeof value.type === 'string';
	}

	/** @param {any} node */
	function summarizeAstNode(node) {
		const chunks = [];
		if (typeof node.name === 'string') chunks.push(`name=${node.name}`);
		if (typeof node.operator === 'string') chunks.push(`op=${node.operator}`);
		if (typeof node.kind === 'string') chunks.push(`kind=${node.kind}`);
		if (typeof node.path === 'string') chunks.push(`path=${node.path}`);
		if (typeof node.alias === 'string') chunks.push(`alias=${node.alias}`);
		if (node.params?.length) chunks.push(`params(${node.params.join(', ')})`);
		if (node.value !== undefined && (typeof node.value === 'string' || typeof node.value === 'number' || typeof node.value === 'boolean')) {
			chunks.push(`value=${String(node.value)}`);
		}
		return chunks.join('  ');
	}

	/** @param {any} node @param {string | undefined} key @param {string} id */
	function toAstViewNode(node, key, id) {
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

	/** @param {any} ast */
	function normalizeAst(ast) {
		if (!isAstNode(ast)) return null;
		return toAstViewNode(ast, undefined, 'root');
	}

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
			const fallback = tabs[0]?.id ?? firstAvailableFileId();
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

	let activeCode = $derived(tabs.find((tab) => tab.id === activeTabId)?.content ?? '');

	/** @param {string} nextCode */
	function updateActiveCode(nextCode) {
		tabs = tabs.map((tab) => (tab.id === activeTabId ? { ...tab, content: nextCode } : tab));
		writeWorkspaceFile(activeTabId, nextCode);
	}

	onMount(async () => {
		await initZenFS();
		seedWorkspaceFiles(fileContents);

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
			const fallback = firstAvailableFileId();
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
	});

	onDestroy(() => {
		for (const pending of runPending.values()) {
			pending.reject(new Error('Execution worker disposed.'));
		}
		runPending.clear();
		runWorker?.terminate();
		runWorker = null;
	});

	$effect(() => {
		const code = activeCode;
		const fileId = activeTabId;
		const timer = setTimeout(() => {
			refreshAst(code, `/${fileId}`);
		}, 180);
		return () => clearTimeout(timer);
	});

	/** @param {'info'|'success'|'error'|'warning'} level @param {string} message */
	function appendLog(level, message) {
		terminalLogs = [...terminalLogs, { time: timestamp(), level, message }];
	}

	async function runActive() {
		await initZenFS();
		appendLog('info', `Running ${activeTabId}`);

		try {
			const workerResult = await runInWorker({
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

	/** @param {string} nodeId */
	function selectNode(nodeId) {
		selectedNodeId = nodeId;
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
</script>

<svelte:head>
	<title>Mimo Playground</title>
	<meta name="description" content="Advanced multi-panel playground for Mimo." />
</svelte:head>

	<div class={resolvedTheme === 'dark' ? 'dark' : resolvedTheme === 'light' ? 'light' : ''}>
		<div class="h-screen bg-app-bg text-app-fg">
			<HeaderBar
				sidebarOpen={sidebarOpen}
				{fsStatus}
				onToggleSidebar={() => (sidebarOpen = !sidebarOpen)}
				onRun={runActive}
				onShare={shareWorkspace}
				onOpenSettings={() => (settingsOpen = true)}
			/>

		<main class="h-[calc(100vh-4.5rem)] overflow-hidden">
			{#if sidebarOpen}
				<SplitPane orientation="vertical" bind:ratio={sidebarRatio} min={14} max={35}>
						{#snippet first()}
							<SidebarExplorer
								{tree}
								activeFileId={activeTabId}
								{selectedNodeId}
								onSelectFile={openFile}
								onSelectNode={selectNode}
								onCreateFile={createFile}
								onCreateFolder={createFolder}
								onRename={renameNode}
								onDelete={deleteNode}
							/>
					{/snippet}
					{#snippet second()}
						<SplitPane orientation="vertical" bind:ratio={workspaceRatio} min={45} max={80}>
							{#snippet first()}
								<SplitPane orientation="horizontal" bind:ratio={centerRatio} min={45} max={80}>
									{#snippet first()}
										<EditorPanel
											{tabs}
											{activeTabId}
											value={activeCode}
											onSelectTab={selectTab}
											onCloseTab={closeTab}
											onChange={updateActiveCode}
											{resolvedTheme}
											{fontSize}
											{tabSize}
										/>
									{/snippet}
									{#snippet second()}
										<TerminalPanel logs={terminalLogs} onRunCommand={runCommand} onClearLogs={clearTerminalLogs} />
									{/snippet}
								</SplitPane>
							{/snippet}
							{#snippet second()}
								<SplitPane orientation="horizontal" bind:ratio={rightRatio} min={30} max={70}>
									{#snippet first()}
										<AstViewerPanel {astData} {astError} {astLoading} />
									{/snippet}
									{#snippet second()}
										<OutputPanel output={outputLines} {errors} {warnings} onClearTab={clearOutputTab} />
									{/snippet}
								</SplitPane>
							{/snippet}
						</SplitPane>
					{/snippet}
				</SplitPane>
			{:else}
				<SplitPane orientation="vertical" bind:ratio={workspaceRatio} min={45} max={80} className="h-full">
					{#snippet first()}
						<SplitPane orientation="horizontal" bind:ratio={centerRatio} min={45} max={80}>
							{#snippet first()}
								<EditorPanel
									{tabs}
									{activeTabId}
									value={activeCode}
									onSelectTab={selectTab}
									onCloseTab={closeTab}
									onChange={updateActiveCode}
									{resolvedTheme}
									{fontSize}
									{tabSize}
								/>
							{/snippet}
							{#snippet second()}
								<TerminalPanel logs={terminalLogs} onRunCommand={runCommand} onClearLogs={clearTerminalLogs} />
							{/snippet}
						</SplitPane>
					{/snippet}
					{#snippet second()}
						<SplitPane orientation="horizontal" bind:ratio={rightRatio} min={30} max={70}>
							{#snippet first()}
								<AstViewerPanel {astData} {astError} {astLoading} />
							{/snippet}
							{#snippet second()}
								<OutputPanel output={outputLines} {errors} {warnings} onClearTab={clearOutputTab} />
							{/snippet}
						</SplitPane>
					{/snippet}
				</SplitPane>
			{/if}
		</main>

		<SettingsModal
			open={settingsOpen}
			bind:theme
			bind:fontSize
			bind:tabSize
			bind:autoSave
			onClose={() => (settingsOpen = false)}
		/>
		<ShareModal
			open={shareOpen}
			{shareLink}
			linkError={shareLinkError}
			onClose={() => (shareOpen = false)}
			onGenerateLink={generateShareLink}
			onDownloadZip={downloadWorkspaceZip}
			onCopyLink={copyShareLink}
		/>
	</div>
</div>
