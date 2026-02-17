<script>
	import AstTreeNode from './AstTreeNode.svelte';
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';

	let {
		astData = null,
		astError = '',
		astLoading = false
	} = $props();

	let expandedIds = $state(new Set());

	/** @param {string} id */
	function toggleNode(id) {
		const next = new Set(expandedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		expandedIds = next;
	}

	/** @param {any} node */
	function countNodes(node) {
		if (!node) return 0;
		let total = 1;
		for (const child of node.children ?? []) total += countNodes(child);
		return total;
	}

	/** @param {any} node @param {string[]} [acc] */
	function collectIds(node, acc = []) {
		if (!node) return acc;
		acc.push(node.id);
		for (const child of node.children ?? []) collectIds(child, acc);
		return acc;
	}

	function expandAll() {
		expandedIds = new Set(collectIds(astData));
	}

	function collapseAll() {
		expandedIds = astData ? new Set([astData.id]) : new Set();
	}

	$effect(() => {
		if (!astData) {
			expandedIds = new Set();
			return;
		}
		expandedIds = new Set([astData.id, ...astData.children.slice(0, 3).map((/** @type {any} */ n) => n.id)]);
	});

	let nodeCount = $derived(countNodes(astData));
</script>

<section class="flex h-full flex-col border border-border/40 bg-surface text-app-fg">
	<div class="flex items-center justify-between border-b border-border px-3 py-2">
		<div>
			<div class="flex items-center gap-2">
				<GitBranch size={14} class="text-text-soft" />
				<h2 class="text-sm font-semibold text-app-fg">AST Viewer</h2>
			</div>
			<p class="text-[11px] text-text-soft">{nodeCount ? `${nodeCount} nodes` : 'No AST yet'}</p>
		</div>
		<div class="flex items-center gap-1">
			<button
				type="button"
				onclick={expandAll}
				class="rounded-lg border border-border px-2 py-1 text-xs hover:bg-surface-elevated"
				disabled={!astData}
			>
				Expand
			</button>
			<button
				type="button"
				onclick={collapseAll}
				class="rounded-lg border border-border px-2 py-1 text-xs hover:bg-surface-elevated"
				disabled={!astData}
			>
				Collapse
			</button>
		</div>
	</div>

	{#if astLoading}
		<div class="flex min-h-0 flex-1 items-center justify-center gap-2 text-sm text-text-muted">
			<LoaderCircle size={16} class="animate-spin" />
			<span>Parsing AST...</span>
		</div>
	{:else if astError}
		<div class="min-h-0 flex-1 overflow-auto p-3">
			<div class="rounded-lg border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">
				<div class="mb-1 flex items-center gap-2 font-semibold">
					<AlertTriangle size={14} />
					AST Parse Error
				</div>
				<p class="whitespace-pre-wrap break-words text-xs leading-relaxed">{astError}</p>
			</div>
		</div>
	{:else if astData}
		<div class="min-h-0 flex-1 overflow-auto p-2">
			<AstTreeNode node={astData} depth={0} {expandedIds} onToggle={toggleNode} />
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 items-center justify-center text-sm text-text-soft">
			Run or edit code to generate AST.
		</div>
	{/if}
</section>
