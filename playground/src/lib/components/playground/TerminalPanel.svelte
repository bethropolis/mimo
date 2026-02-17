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
		info: 'text-sky-300',
		success: 'text-emerald-300',
		error: 'text-rose-300',
		warning: 'text-amber-300'
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

<section class="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
	<div class="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
		<div class="flex items-center gap-2">
			<Terminal size={14} />
			<h2 class="text-sm font-semibold">Terminal</h2>
		</div>
		<div class="flex items-center gap-1">
			<button
				type="button"
				onclick={copyLogs}
				class="inline-flex items-center rounded-md border border-zinc-300 bg-zinc-100 p-1.5 text-zinc-600 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
				aria-label="Copy logs"
			>
				<Copy size={12} />
			</button>
			<button
				type="button"
				onclick={onClearLogs}
				class="inline-flex items-center rounded-md border border-zinc-300 bg-zinc-100 p-1.5 text-zinc-600 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
				aria-label="Clear logs"
			>
				<Trash2 size={12} />
			</button>
		</div>
	</div>

	<div bind:this={viewportEl} class="min-h-0 flex-1 overflow-auto bg-zinc-950 p-3 font-mono text-xs text-zinc-200">
		{#if logs.length === 0}
			<p class="text-zinc-500">No terminal logs yet.</p>
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

	<div class="grid grid-cols-[1fr_auto] gap-2 border-t border-zinc-200 p-2 dark:border-zinc-800">
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
			class="flex-1 rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 dark:border-zinc-700 dark:bg-zinc-800"
		/>
		<button
			type="button"
			onclick={submit}
			class="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-900"
		>
			Run
		</button>
	</div>
</section>
