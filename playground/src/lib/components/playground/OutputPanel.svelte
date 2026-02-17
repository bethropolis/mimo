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
		output: 'border-border bg-panel-alt text-app-fg',
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

<section class="flex h-full flex-col border border-border/40 bg-surface">
	<div class="flex items-center justify-between border-b border-border px-2 py-2">
		<div class="flex items-center">
			{#each tabs as pane}
				<button
					type="button"
					onclick={() => (tab = pane.id)}
					class={`mr-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${
						tab === pane.id
							? 'bg-accent text-accent-contrast'
							: 'text-text-muted hover:bg-surface-elevated'
					}`}
				>
					<pane.icon size={14} />
					<span>{pane.label}</span>
					<span class="rounded-md bg-surface-elevated px-1 text-[10px]">{countFor(pane.id)}</span>
				</button>
			{/each}
		</div>
		<div class="flex items-center gap-1">
			<button
				type="button"
				onclick={copyCurrent}
				class="inline-flex items-center rounded-md border border-border bg-surface-elevated p-1.5 text-text-muted hover:bg-panel-alt"
				aria-label="Copy current tab"
			>
				<Copy size={12} />
			</button>
			<button
				type="button"
				onclick={() => onClearTab?.(tab)}
				class="inline-flex items-center rounded-md border border-border bg-surface-elevated p-1.5 text-text-muted hover:bg-panel-alt"
				aria-label="Clear current tab"
			>
				<Trash2 size={12} />
			</button>
		</div>
	</div>
	<div class="min-h-0 flex-1 overflow-auto p-3 font-mono text-sm">
		{#if items.length === 0}
			<p class="text-text-soft">No {tab} yet.</p>
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
