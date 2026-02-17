<script>
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Copy from '@lucide/svelte/icons/copy';
	import Terminal from '@lucide/svelte/icons/terminal';

	let { logs = [], onRunCommand, onClearLogs } = $props();
	let command = $state('run src/main.mimo');
	let history = $state(/** @type {string[]} */ ([]));
	let historyIndex = $state(-1);
	let viewportEl = $state();

	/** @type {Record<string, string>} */
	const levelClass = {
		info: 'text-sky-700 dark:text-sky-300',
		success: 'text-emerald-700 dark:text-emerald-300',
		error: 'text-rose-700 dark:text-rose-300',
		warning: 'text-amber-700 dark:text-amber-300'
	};

	/** @type {Record<string, string>} */
	const levelBadge = {
		info: 'bg-sky-500/20 border-sky-400/40',
		success: 'bg-emerald-500/20 border-emerald-400/40',
		error: 'bg-rose-500/20 border-rose-400/40',
		warning: 'bg-amber-500/20 border-amber-400/40'
	};

	function submit() {
		const next = command.trim();
		if (!next) return;
		onRunCommand(next);
		history = [next, ...history.filter((item) => item !== next)].slice(0, 50);
		historyIndex = -1;
		command = '';
	}

	async function copyLogs() {
		if (!logs.length) return;
		const text = logs.map((log) => `[${log.time}] ${String(log.level).toUpperCase()} ${log.message}`).join('\n');
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// no-op
		}
	}

	/** @param {number} direction */
	function recallHistory(direction) {
		if (!history.length) return;
		const nextIndex = Math.max(0, Math.min(history.length - 1, historyIndex + direction));
		historyIndex = nextIndex;
		command = history[nextIndex] ?? '';
	}

	$effect(() => {
		logs;
		if (!viewportEl) return;
		viewportEl.scrollTop = viewportEl.scrollHeight;
	});
</script>

<section class="flex h-full flex-col border border-border/40 bg-surface">
	<div class="flex items-center justify-between border-b border-border px-3 py-2">
		<div class="flex items-center gap-2">
			<Terminal size={14} />
			<h2 class="text-sm font-semibold">Terminal</h2>
		</div>
		<div class="flex items-center gap-1">
			<button
				type="button"
				onclick={copyLogs}
				class="inline-flex items-center rounded-md border border-border bg-surface-elevated p-1.5 text-text-muted hover:bg-panel-alt"
				aria-label="Copy logs"
			>
				<Copy size={12} />
			</button>
			<button
				type="button"
				onclick={onClearLogs}
				class="inline-flex items-center rounded-md border border-border bg-surface-elevated p-1.5 text-text-muted hover:bg-panel-alt"
				aria-label="Clear logs"
			>
				<Trash2 size={12} />
			</button>
		</div>
	</div>

	<div bind:this={viewportEl} class="min-h-0 flex-1 overflow-auto bg-panel-alt p-3 font-mono text-xs text-app-fg">
		{#if logs.length === 0}
			<p class="text-text-soft">No terminal logs yet.</p>
		{:else}
			{#each logs as log}
				<div class="mb-1.5 grid grid-cols-[4.5rem_5rem_1fr] items-start gap-2">
					<span class="text-zinc-500">{log.time}</span>
					<span class={`inline-flex w-fit rounded border px-1 py-0.5 text-[10px] ${levelClass[String(log.level)] ?? 'text-zinc-300'} ${levelBadge[String(log.level)] ?? 'border-zinc-500/30 bg-zinc-700/30'}`}>
						{String(log.level).toUpperCase()}
					</span>
					<span class="break-words">{log.message}</span>
				</div>
			{/each}
		{/if}
	</div>

	<div class="grid grid-cols-[1fr_auto] gap-2 border-t border-border p-2">
		<input
			bind:value={command}
			onkeydown={(event) => {
				if (event.key === 'Enter') submit();
				if (event.key === 'ArrowUp') {
					event.preventDefault();
					recallHistory(historyIndex < 0 ? 0 : historyIndex + 1);
				}
				if (event.key === 'ArrowDown') {
					event.preventDefault();
					if (historyIndex <= 0) {
						historyIndex = -1;
						command = '';
					} else {
						recallHistory(historyIndex - 1);
					}
				}
			}}
			placeholder="Type command..."
			class="flex-1 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
		/>
		<button
			type="button"
			onclick={submit}
			class="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-contrast hover:brightness-110"
		>
			Run
		</button>
	</div>
</section>
