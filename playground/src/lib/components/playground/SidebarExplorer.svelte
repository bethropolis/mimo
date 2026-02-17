<script>
	import FilePlus2 from '@lucide/svelte/icons/file-plus-2';
	import FolderPlus from '@lucide/svelte/icons/folder-plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import SidebarTreeNode from './SidebarTreeNode.svelte';

	/**
	 * @typedef {{
	 * id: string;
	 * name: string;
	 * type: 'folder'|'file';
	 * kind?: 'file'|'module';
	 * children?: ExplorerNode[];
	 * }} ExplorerNode
	 */

	let {
		tree = /** @type {ExplorerNode[]} */ ([]),
		activeFileId = '',
		selectedNodeId = '',
		onSelectFile,
		onSelectNode,
		onCreateFile,
		onCreateFolder,
		onRename,
		onDelete
	} = $props();

	let collapsed = $state(/** @type {Record<string, boolean>} */ ({}));
	let action = $state(/** @type {'new-file'|'new-folder'|'rename'|null} */ (null));
	let draftName = $state('');
	let deleteArmedId = $state('');
	let editNodeId = $state('');
	let createParentDir = $state('');

	/** @param {string} nodeId */
	function parentPath(nodeId) {
		if (!nodeId.includes('/')) return '';
		const parts = nodeId.split('/');
		parts.pop();
		return parts.join('/');
	}

	/** @param {string} nodeId */
	function toggleFolder(nodeId) {
		collapsed = { ...collapsed, [nodeId]: !collapsed[nodeId] };
	}

	/** @param {ExplorerNode[]} nodes @param {string} nodeId @returns {ExplorerNode | null} */
	function findNodeById(nodes, nodeId) {
		for (const node of nodes) {
			if (node.id === nodeId) return node;
			if (node.children?.length) {
				const found = findNodeById(node.children, nodeId);
				if (found) return found;
			}
		}
		return null;
	}

	function selectedBaseDir() {
		if (!selectedNodeId) return '';
		const node = findNodeById(tree, selectedNodeId);
		if (!node) return '';
		return node.type === 'folder' ? node.id : parentPath(node.id);
	}

	function beginCreateFile() {
		const baseDir = selectedBaseDir();
		action = 'new-file';
		draftName = 'new-file.mimo';
		deleteArmedId = '';
		createParentDir = baseDir;
		editNodeId = `__draft_file__:${Date.now()}`;
		if (baseDir) collapsed = { ...collapsed, [baseDir]: false };
	}

	function beginCreateFolder() {
		const baseDir = selectedBaseDir();
		action = 'new-folder';
		draftName = 'new-folder';
		deleteArmedId = '';
		createParentDir = baseDir;
		editNodeId = `__draft_folder__:${Date.now()}`;
		if (baseDir) collapsed = { ...collapsed, [baseDir]: false };
	}

	function beginRename() {
		if (!selectedNodeId) return;
		action = 'rename';
		draftName = selectedNodeId.split('/').pop() ?? selectedNodeId;
		deleteArmedId = '';
		editNodeId = selectedNodeId;
		const parentId = parentPath(selectedNodeId);
		if (parentId) collapsed = { ...collapsed, [parentId]: false };
	}

	function cancelInlineAction() {
		action = null;
		draftName = '';
		editNodeId = '';
		createParentDir = '';
	}

	function submitInlineAction() {
		const value = draftName.trim();
		if (!value) return;
		let ok = true;
		if (action === 'new-file') {
			ok = onCreateFile(createParentDir, value);
		} else if (action === 'new-folder') {
			ok = onCreateFolder(createParentDir, value);
		} else if (action === 'rename') {
			if (!selectedNodeId) return;
			ok = onRename(selectedNodeId, value);
		}
		if (ok !== false) cancelInlineAction();
	}

	function triggerDelete() {
		if (!selectedNodeId) return;
		if (deleteArmedId === selectedNodeId) {
			const ok = onDelete(selectedNodeId);
			if (ok !== false) deleteArmedId = '';
			return;
		}
		deleteArmedId = selectedNodeId;
	}

	function clearDeleteArm() {
		deleteArmedId = '';
	}

	/** @param {string} value */
	function updateDraftName(value) {
		draftName = value;
	}

	/** @param {ExplorerNode[]} nodes @param {string} parentId @param {ExplorerNode} draftNode */
	function insertDraftNode(nodes, parentId, draftNode) {
		if (!parentId) return [...nodes, draftNode];
		let inserted = false;

		/** @param {ExplorerNode[]} branch @returns {ExplorerNode[]} */
		const walk = (branch) => {
			let changed = false;
			/** @type {ExplorerNode[]} */
			const nextBranch = branch.map((/** @type {ExplorerNode} */ node) => {
				if (node.type !== 'folder') return node;
				if (node.id === parentId) {
					inserted = true;
					changed = true;
					return { ...node, children: [...(node.children ?? []), draftNode] };
				}
				if (!node.children?.length) return node;
				/** @type {ExplorerNode[]} */
				const nextChildren = walk(node.children);
				if (nextChildren !== node.children) {
					changed = true;
					return { ...node, children: nextChildren };
				}
				return node;
			});
			return changed ? nextBranch : branch;
		};

		const mapped = walk(nodes);
		if (inserted) return mapped;
		return [...mapped, draftNode];
	}

	let displayTree = $derived.by(() => {
		if (!action || !editNodeId || action === 'rename') return tree;
		const draftNode =
			action === 'new-folder'
				? /** @type {ExplorerNode} */ ({
						id: editNodeId,
						name: draftName || 'new-folder',
						type: 'folder',
						children: []
					})
				: /** @type {ExplorerNode} */ ({
						id: editNodeId,
						name: draftName || 'new-file.mimo',
						type: 'file',
						kind: createParentDir.startsWith('modules') ? 'module' : 'file'
					});
		return insertDraftNode(tree, createParentDir, draftNode);
	});
</script>

<aside class="flex h-full flex-col border-r border-border bg-panel">
	<div class="border-b border-border px-2.5 py-2">
		<div class="mb-1.5 flex items-center justify-between gap-2">
			<h2 class="text-xs font-semibold uppercase tracking-[0.12em] text-text-soft">
				Explorer
			</h2>
			<div class="flex items-center gap-1">
				<button
					type="button"
					onclick={beginCreateFile}
					class="inline-flex items-center rounded border border-border bg-surface p-1 text-app-fg hover:bg-surface-elevated"
					aria-label="New file"
					title="New file"
				>
					<FilePlus2 size={12} />
				</button>
				<button
					type="button"
					onclick={beginCreateFolder}
					class="inline-flex items-center rounded border border-border bg-surface p-1 text-app-fg hover:bg-surface-elevated"
					aria-label="New folder"
					title="New folder"
				>
					<FolderPlus size={12} />
				</button>
				<button
					type="button"
					onclick={beginRename}
					class="inline-flex items-center rounded border border-border bg-surface p-1 text-app-fg hover:bg-surface-elevated disabled:opacity-40"
					aria-label="Rename selected"
					title="Rename"
					disabled={!selectedNodeId}
				>
					<Pencil size={12} />
				</button>
				<button
					type="button"
					onclick={triggerDelete}
					class={`inline-flex items-center rounded border bg-surface p-1 text-app-fg hover:bg-surface-elevated disabled:opacity-40 ${
						deleteArmedId === selectedNodeId
							? 'border-rose-400 text-rose-700 dark:border-rose-500 dark:text-rose-300'
							: 'border-border'
					}`}
					aria-label="Delete selected"
					title={deleteArmedId === selectedNodeId ? 'Click again to delete' : 'Delete'}
					disabled={!selectedNodeId}
				>
					<Trash2 size={12} />
				</button>
			</div>
		</div>
		{#if deleteArmedId === selectedNodeId && selectedNodeId}
			<p class="mb-1 text-[10px] text-rose-600 dark:text-rose-300">click trash again to confirm</p>
		{/if}
	</div>
	<div class="flex-1 overflow-auto p-1.5">
		{#each displayTree as node (node.id)}
			<SidebarTreeNode
				{node}
				depth={0}
				{collapsed}
				{activeFileId}
				{selectedNodeId}
				{deleteArmedId}
				{editNodeId}
				{draftName}
				{onSelectFile}
				{onSelectNode}
				onToggleFolder={toggleFolder}
				onClearDelete={clearDeleteArm}
				onDraftNameChange={updateDraftName}
				onSubmitEdit={submitInlineAction}
				onCancelEdit={cancelInlineAction}
			/>
		{/each}
	</div>
</aside>
