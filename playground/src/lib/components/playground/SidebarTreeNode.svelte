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
				class="mr-0.5 rounded p-0.5 text-zinc-500 hover:bg-zinc-200/70 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
			<div class="flex min-w-0 flex-1 items-center gap-1 rounded border border-zinc-300 bg-white px-1 py-0.5 dark:border-zinc-700 dark:bg-zinc-900">
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
					class="w-full bg-transparent text-xs text-zinc-800 outline-none dark:text-zinc-100"
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
					class="inline-flex items-center rounded p-0.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
						? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200'
						: selectedNodeId === node.id
							? 'bg-zinc-200/80 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100'
							: 'text-zinc-700 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-800'
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
					<span class="ml-auto text-[9px] uppercase tracking-[0.08em] text-rose-600 dark:text-rose-300">delete?</span>
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
