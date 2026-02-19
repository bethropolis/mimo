<script>
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Copy from '@lucide/svelte/icons/copy';
	import Terminal from '@lucide/svelte/icons/terminal';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { getTypeClasses, getTypePrefix } from '$lib/terminal/formatter.js';

	let {
		entries = [],
		history = [],
		onRunCommand,
		onClearLogs
	} = $props();

	let command = $state('');
	let historyIndex = $state(-1);
	let viewportEl = $state(/** @type {HTMLDivElement | null} */(null));
	let inputEl = $state(/** @type {HTMLInputElement | null} */(null));
	let suggestions = $state(/** @type {string[]} */([]));
	let selectedSuggestion = $state(-1);
	let collapsedEntries = $state(new Set());

	$effect(() => {
		entries;
		if (!viewportEl) return;
		requestAnimationFrame(() => {
			if (viewportEl) {
				viewportEl.scrollTop = viewportEl.scrollHeight;
			}
		});
	});

	function submit() {
		const next = command.trim();
		if (!next) return;
		onRunCommand?.(next);
		historyIndex = -1;
		command = '';
		suggestions = [];
	}

	/** @param {KeyboardEvent} e */
	function handleKeydown(e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			submit();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (suggestions.length > 0) {
				selectedSuggestion = Math.max(0, selectedSuggestion - 1);
			} else if (history.length > 0) {
				const nextIndex = historyIndex < 0 ? 0 : Math.min(historyIndex + 1, history.length - 1);
				historyIndex = nextIndex;
				command = history[nextIndex] ?? '';
			}
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (suggestions.length > 0) {
				selectedSuggestion = Math.min(suggestions.length - 1, selectedSuggestion + 1);
			} else if (historyIndex >= 0) {
				const nextIndex = historyIndex - 1;
				historyIndex = nextIndex;
				command = nextIndex < 0 ? '' : history[nextIndex] ?? '';
			}
		} else if (e.key === 'Tab') {
			e.preventDefault();
			if (suggestions.length > 0) {
				command = suggestions[selectedSuggestion >= 0 ? selectedSuggestion : 0];
				suggestions = [];
			}
		} else if (e.key === 'Escape') {
			suggestions = [];
		} else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			onClearLogs?.();
		}
	}

	/** @param {Event} e */
	function handleInput(e) {
		const value = /** @type {HTMLInputElement} */(e.target).value;
		command = value;
		historyIndex = -1;
		
		// Get suggestions for current input
		if (value.trim() && !value.includes(' ')) {
			suggestions = getSuggestions(value);
			selectedSuggestion = 0;
		} else {
			suggestions = [];
		}
	}

	/** @param {string} partial */
	function getSuggestions(partial) {
		// Basic command suggestions - could be enhanced with context
		const cmds = ['help', 'clear', 'ls', 'cat', 'run', 'files', 'echo', 'pwd', 'version'];
		return cmds.filter(c => c.startsWith(partial.toLowerCase()));
	}

	/** @param {string} suggestion */
	function applySuggestion(suggestion) {
		command = suggestion;
		suggestions = [];
		inputEl?.focus();
	}

	async function copyLogs() {
		if (!entries.length) return;
		const text = entries.map(e => `[${e.timestamp}] ${e.content}`).join('\n');
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// no-op
		}
	}

	/** @param {string} id */
	function toggleCollapse(id) {
		const next = new Set(collapsedEntries);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		collapsedEntries = next;
	}

	function focusInput() {
		inputEl?.focus();
	}
</script>

<section
	class="flex h-full flex-col border border-border/40 bg-surface font-mono text-sm"
	onclick={focusInput}
>
	<div class="flex items-center justify-between border-b border-border/50 bg-panel-alt/30 px-3 py-1.5">
		<div class="flex items-center gap-2">
			<Terminal size={14} class="text-text-soft" />
			<span class="text-xs font-semibold text-text-muted">Terminal</span>
		</div>
		<div class="flex items-center gap-1">
			<button
				type="button"
				onclick={(e) => { e.stopPropagation(); copyLogs(); }}
				class="rounded-md p-1 text-text-soft hover:bg-surface-elevated hover:text-app-fg"
				title="Copy logs (Ctrl+Shift+C)"
			>
				<Copy size={12} />
			</button>
			<button
				type="button"
				onclick={(e) => { e.stopPropagation(); onClearLogs?.(); }}
				class="rounded-md p-1 text-text-soft hover:bg-rose-500/10 hover:text-rose-500"
				title="Clear (Ctrl+L)"
			>
				<Trash2 size={12} />
			</button>
		</div>
	</div>

	<div bind:this={viewportEl} class="min-h-0 flex-1 overflow-auto bg-app-bg/50 p-2">
		{#if entries.length === 0}
			<div class="flex h-full flex-col items-center justify-center text-text-soft">
				<Terminal size={24} class="mb-2 opacity-40" />
				<p class="text-xs">Type `help` for available commands</p>
			</div>
		{:else}
			{#each entries as entry (entry.id)}
				<div class="group mb-0.5">
					{#if entry.isCollapsible}
						<button
							type="button"
							onclick={() => toggleCollapse(entry.id)}
							class="flex items-center gap-1 text-[10px] text-text-soft hover:text-text-muted"
						>
							{#if collapsedEntries.has(entry.id)}
								<ChevronRight size={10} />
							{:else}
								<ChevronDown size={10} />
							{/if}
							<span>{entry.content.split('\n').length} lines</span>
						</button>
					{/if}
					
					{#if !entry.isCollapsible || !collapsedEntries.has(entry.id)}
						{@const lines = entry.content.split('\n')}
						{#each lines as line, i}
							<div class="flex items-start gap-2 py-0.5 leading-relaxed">
								{#if i === 0}
									<span class="shrink-0 text-[10px] text-text-soft/50 w-16">{entry.timestamp}</span>
									{#if getTypePrefix(entry.type)}
										<span class="shrink-0 w-4 text-center {getTypeClasses(entry.type)}">{getTypePrefix(entry.type)}</span>
									{:else}
										<span class="shrink-0 w-4"></span>
									{/if}
								{:else}
									<span class="shrink-0 w-20"></span>
								{/if}
								<span class="break-all {i === 0 ? getTypeClasses(entry.type) : 'text-text-muted'}">{line}</span>
							</div>
						{/each}
					{/if}
				</div>
			{/each}
		{/if}
	</div>

	<div class="relative border-t border-border/50 bg-panel-alt/20">
		{#if suggestions.length > 0}
			<div class="absolute bottom-full left-0 right-0 mb-1 flex flex-wrap gap-1 border border-border/50 bg-surface p-1 text-xs">
				{#each suggestions as suggestion, i}
					<button
						type="button"
						onclick={(e) => { e.stopPropagation(); applySuggestion(suggestion); }}
						class="rounded px-2 py-0.5 {i === selectedSuggestion ? 'bg-accent text-accent-contrast' : 'bg-surface-elevated text-text-muted hover:bg-surface-muted'}"
					>
						{suggestion}
					</button>
				{/each}
			</div>
		{/if}

		<div class="flex items-center gap-2 px-3 py-2">
			<span class="text-accent">❯</span>
			<input
				bind:this={inputEl}
				bind:value={command}
				oninput={handleInput}
				onkeydown={handleKeydown}
				placeholder="Type a command or Mimo code..."
				autocomplete="off"
				spellcheck="false"
				class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-soft/50"
			/>
		</div>
	</div>
</section>
