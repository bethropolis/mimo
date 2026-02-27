<script>
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';

	let {
		open = false,
		actions = [],
		onClose,
		onSelect
	} = $props();

	let query = $state('');
	let selectedIndex = $state(0);
	let inputEl = $state(/** @type {HTMLInputElement | null} */(null));

	let filtered = $derived(
		actions.filter((a) => a.label.toLowerCase().includes(query.trim().toLowerCase()))
	);

	$effect(() => {
		if (open) {
			query = '';
			selectedIndex = 0;
			setTimeout(() => inputEl?.focus(), 0);
		}
	});

	/** @param {number} index */
	function choose(index) {
		const action = filtered[index];
		if (!action) return;
		onSelect?.(action.id);
	}

	/** @param {KeyboardEvent} event */
	function onKeydown(event) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			selectedIndex = Math.min(filtered.length - 1, selectedIndex + 1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			selectedIndex = Math.max(0, selectedIndex - 1);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			choose(selectedIndex);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			onClose?.();
		}
	}
</script>

{#if open}
	<div class="fixed inset-0 z-[120] flex items-start justify-center bg-overlay/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
		<div class="mt-24 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl">
			<div class="flex items-center gap-2 border-b border-border px-3 py-2">
				<Search size={16} class="text-text-soft" />
				<input
					bind:this={inputEl}
					bind:value={query}
					onkeydown={onKeydown}
					placeholder="Type a command..."
					class="w-full bg-transparent text-sm text-app-fg outline-none placeholder:text-text-soft"
				/>
				<button type="button" onclick={onClose} class="rounded p-1 text-text-soft hover:bg-surface-elevated hover:text-app-fg">
					<X size={14} />
				</button>
			</div>

			<div class="max-h-80 overflow-auto p-2">
				{#if filtered.length === 0}
					<div class="px-2 py-3 text-sm text-text-soft">No actions found.</div>
				{:else}
					{#each filtered as action, i (action.id)}
						<button
							type="button"
							onclick={() => choose(i)}
							class={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
								i === selectedIndex
									? 'bg-accent/15 text-app-fg'
									: 'text-text-muted hover:bg-surface-elevated hover:text-app-fg'
							}`}
						>
							<span>{action.label}</span>
							{#if action.shortcut}
								<kbd class="rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] text-text-soft">{action.shortcut}</kbd>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}
