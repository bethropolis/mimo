<script>
	import PackageCheck from '@lucide/svelte/icons/package-check';
	import CircleX from '@lucide/svelte/icons/circle-x';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Copy from '@lucide/svelte/icons/copy';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	let { output = [], errors = [], warnings = [], onClearTab } = $props();
	let tab = $state('output');

	let items = $derived(tab === 'errors' ? errors : tab === 'warnings' ? warnings : output);

	/** @type {{ id: 'output'|'errors'|'warnings'; label: string; icon: any }[]} */
	const tabs = [
		{ id: 'output', label: 'Output', icon: PackageCheck },
		{ id: 'errors', label: 'Errors', icon: CircleX },
		{ id: 'warnings', label: 'Warnings', icon: TriangleAlert }
	];

	/** @type {Record<string, string>} */
	const tone = {
		output: 'border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100',
		errors: 'border-rose-300/60 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
		warnings: 'border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
	};

	/** @param {'output'|'errors'|'warnings'} tabId */
	function countFor(tabId) {
		if (tabId === 'errors') return errors.length;
		if (tabId === 'warnings') return warnings.length;
		return output.length;
	}

	async function copyCurrent() {
		if (!items.length) return;
		try {
			await navigator.clipboard.writeText(items.join('\n'));
		} catch {
			// no-op
		}
	}
</script>

<section class="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
	<div class="flex items-center justify-between border-b border-zinc-200 px-2 py-2 dark:border-zinc-800">
		<div class="flex items-center">
			{#each tabs as pane}
				<button
					type="button"
					onclick={() => (tab = pane.id)}
					class={`mr-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${
						tab === pane.id
							? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
							: 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
					}`}
				>
					<pane.icon size={14} />
					<span>{pane.label}</span>
					<span class="rounded-md bg-black/10 px-1 text-[10px] dark:bg-white/20">{countFor(pane.id)}</span>
				</button>
			{/each}
		</div>
		<div class="flex items-center gap-1">
			<button
				type="button"
				onclick={copyCurrent}
				class="inline-flex items-center rounded-md border border-zinc-300 bg-zinc-100 p-1.5 text-zinc-600 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
				aria-label="Copy current tab"
			>
				<Copy size={12} />
			</button>
			<button
				type="button"
				onclick={() => onClearTab?.(tab)}
				class="inline-flex items-center rounded-md border border-zinc-300 bg-zinc-100 p-1.5 text-zinc-600 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
				aria-label="Clear current tab"
			>
				<Trash2 size={12} />
			</button>
		</div>
	</div>
	<div class="min-h-0 flex-1 overflow-auto p-3 font-mono text-sm">
		{#if items.length === 0}
			<p class="text-zinc-500 dark:text-zinc-400">No {tab} yet.</p>
		{:else}
			{#each items as item, index}
				<div class={`mb-2 rounded-lg border p-2 ${tone[tab] ?? tone.output}`}>
					<p class="mb-1 text-[10px] opacity-70">#{index + 1}</p>
					<p class="whitespace-pre-wrap break-words leading-relaxed">{item}</p>
				</div>
			{/each}
		{/if}
	</div>
</section>
