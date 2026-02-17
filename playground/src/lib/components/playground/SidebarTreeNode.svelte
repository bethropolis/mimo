<script>
	import Self from './SidebarTreeNode.svelte';
	import Check from '@lucide/svelte/icons/check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FileCode2 from '@lucide/svelte/icons/file-code-2';
	import Folder from '@lucide/svelte/icons/folder';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import Package from '@lucide/svelte/icons/package';
	import X from '@lucide/svelte/icons/x';

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
		node,
		depth = 0,
		collapsed = {},
		activeFileId = '',
		selectedNodeId = '',
		deleteArmedId = '',
		editNodeId = '',
		draftName = '',
		onSelectFile,
		onSelectNode,
		onToggleFolder,
		onClearDelete,
		onDraftNameChange,
		onSubmitEdit,
		onCancelEdit
	} = $props();
</script>

<div>
	<div class="flex items-center" style={`padding-left: ${depth * 10}px`}>
		{#if node.type === 'folder'}
			<button
				type="button"
				onclick={() => onToggleFolder(node.id)}
				class="mr-0.5 rounded p-0.5 text-text-soft hover:bg-surface-elevated"
			>
				{#if collapsed[node.id]}
					<ChevronRight size={12} />
				{:else}
					<ChevronDown size={12} />
				{/if}
			</button>
		{:else}
			<div class="mr-0.5 h-4 w-4"></div>
		{/if}
		{#if editNodeId === node.id}
			<div class="flex min-w-0 flex-1 items-center gap-1 rounded border border-border bg-surface px-1 py-0.5">
				{#if node.type === 'folder'}
					<FolderOpen size={13} />
				{:else if node.kind === 'module'}
					<Package size={13} />
				{:else}
					<FileCode2 size={13} />
				{/if}
				<input
					type="text"
					value={draftName}
					oninput={(event) => onDraftNameChange(event.currentTarget.value)}
					onkeydown={(event) => {
						if (event.key === 'Enter') onSubmitEdit();
						if (event.key === 'Escape') onCancelEdit();
					}}
					class="w-full bg-transparent text-xs text-app-fg outline-none"
				/>
				<button
					type="button"
					onclick={onSubmitEdit}
					class="inline-flex items-center rounded p-0.5 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
					aria-label="Confirm"
				>
					<Check size={11} />
				</button>
				<button
					type="button"
					onclick={onCancelEdit}
					class="inline-flex items-center rounded p-0.5 text-text-muted hover:bg-surface-elevated"
					aria-label="Cancel"
				>
					<X size={11} />
				</button>
			</div>
		{:else}
			<button
				type="button"
				onclick={() => {
					onSelectNode(node.id);
					onClearDelete();
					if (node.type === 'file') onSelectFile(node.id);
				}}
				class={`flex min-w-0 flex-1 items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs transition ${
					activeFileId === node.id
						? 'bg-accent-muted text-accent'
						: selectedNodeId === node.id
							? 'bg-surface-elevated text-app-fg'
							: 'text-app-fg hover:bg-surface-elevated'
				}`}
			>
				{#if node.type === 'folder'}
					{#if collapsed[node.id]}
						<Folder size={13} />
					{:else}
						<FolderOpen size={13} />
					{/if}
				{:else if node.kind === 'module'}
					<Package size={13} />
				{:else}
					<FileCode2 size={13} />
				{/if}
				<span class="truncate">{node.name}</span>
				{#if deleteArmedId === node.id}
					<span class="ml-auto text-[9px] uppercase tracking-[0.08em] text-rose-600 dark:text-rose-400">delete?</span>
				{/if}
			</button>
		{/if}
	</div>
	{#if node.type === 'folder' && !collapsed[node.id]}
		{#each node.children ?? [] as child (child.id)}
			<Self
				node={child}
				depth={depth + 1}
				{collapsed}
				{activeFileId}
				{selectedNodeId}
				{deleteArmedId}
				{editNodeId}
				{draftName}
				{onSelectFile}
				{onSelectNode}
				onToggleFolder={onToggleFolder}
				onClearDelete={onClearDelete}
				{onDraftNameChange}
				{onSubmitEdit}
				{onCancelEdit}
			/>
		{/each}
	{/if}
</div>
