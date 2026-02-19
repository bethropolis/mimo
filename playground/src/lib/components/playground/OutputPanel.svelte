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

<section class="flex h-full flex-col border border-border/40 bg-surface shadow-sm">
	<div class="flex items-center justify-between border-b border-border/40 bg-panel-alt/30 px-3 py-2">
		<div class="flex items-center p-1 bg-surface-muted rounded-xl border border-border/30">
			{#each tabs as pane}
				<button
					type="button"
					onclick={() => (tab = pane.id)}
					class={`relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
						tab === pane.id
							? 'bg-accent text-accent-contrast shadow-md scale-105 z-10'
							: 'text-text-soft hover:bg-surface-elevated hover:text-app-fg'
					}`}
				>
					<pane.icon size={14} strokeWidth={2.5} />
					<span>{pane.label}</span>
					<span class={`rounded-full px-1.5 py-0.5 text-[10px] ${
						tab === pane.id ? 'bg-accent-contrast/20 text-accent-contrast' : 'bg-surface-elevated text-text-soft'
					}`}>{countFor(pane.id)}</span>
				</button>
			{/each}
		</div>
		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={copyCurrent}
				class="inline-flex items-center rounded-xl border border-border bg-surface px-3 py-2 text-text-soft hover:bg-surface-elevated hover:text-app-fg transition-colors"
				title="Copy current tab"
			>
				<Copy size={14} />
			</button>
			<button
				type="button"
				onclick={() => onClearTab?.(tab)}
				class="inline-flex items-center rounded-xl border border-border bg-surface px-3 py-2 text-text-soft hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
				title="Clear current tab"
			>
				<Trash2 size={14} />
			</button>
		</div>
	</div>
	<div class="min-h-0 flex-1 overflow-auto bg-app-bg/30 p-4 font-mono text-sm scroll-smooth">
		{#if items.length === 0}
			<div class="flex h-full flex-col items-center justify-center opacity-40">
				<div class="mb-2 rounded-full bg-surface-elevated p-4">
					<PackageCheck size={32} />
				</div>
				<p class="text-sm italic">No {tab} recorded.</p>
			</div>
		{:else}
			{#each items as item, index}
				<div class={`mb-3 last:mb-0 rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${tone[tab] ?? tone.output}`}>
					<div class="flex items-center justify-between border-b border-current/10 bg-current/5 px-3 py-1.5">
						<span class="text-[10px] font-bold uppercase tracking-wider opacity-60">Entry #{index + 1}</span>
						<span class="text-[9px] opacity-40">{new Date().toLocaleTimeString()}</span>
					</div>
					<div class="p-3">
						<p class="whitespace-pre-wrap break-words leading-relaxed">{item}</p>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</section>
