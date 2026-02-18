<script>
	import Self from './AstTreeNode.svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	/**
	 * @typedef {{
	 * id: string;
	 * key?: string;
	 * type: string;
	 * summary?: string;
	 * location?: { line?: number; column?: number; file?: string };
	 * children: AstViewNode[];
	 * }} AstViewNode
	 */

	let {
		node,
		depth = 0,
		expandedIds = new Set(),
		onToggle,
		onSelect
	} = $props();

	let hasChildren = $derived((node.children?.length ?? 0) > 0);
	let isExpanded = $derived(expandedIds.has(node.id));

	function handleSelect(e) {
		if (node.location?.line) {
			onSelect(node.location.line, node.location.column ?? 1);
		}
	}
</script>

<div>
	<button
		type="button"
		onclick={(e) => {
			if (hasChildren) onToggle(node.id);
			handleSelect(e);
		}}
		class={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-surface-elevated ${hasChildren ? '' : 'opacity-95'}`}
		style={`padding-left:${depth * 12 + 8}px`}
	>
		<span class="w-4 text-text-soft">
			{#if hasChildren}
				{#if isExpanded}
					<ChevronDown size={14} />
				{:else}
					<ChevronRight size={14} />
				{/if}
			{:else}
				•
			{/if}
		</span>

		{#if node.key}
			<span class="rounded bg-surface-elevated px-1 text-[10px] text-text-soft">{node.key}</span>
		{/if}

		<span class="rounded-md border border-sky-400/35 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-sky-200">
			{node.type}
		</span>

		{#if node.summary}
			<span class="truncate text-xs text-text-muted">{node.summary}</span>
		{/if}

		{#if node.location?.line}
			<span class="ml-auto shrink-0 text-[10px] text-text-soft">Ln {node.location.line}, Col {node.location.column ?? 1}</span>
		{/if}
	</button>

	{#if hasChildren && isExpanded}
		{#each node.children as child (child.id)}
			<Self node={child} depth={depth + 1} {expandedIds} {onToggle} {onSelect} />
		{/each}
	{/if}
</div>
