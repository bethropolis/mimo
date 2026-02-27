<script>
	import X from '@lucide/svelte/icons/x';
	import Keyboard from '@lucide/svelte/icons/keyboard';

	let { open = false, onClose } = $props();

	const items = [
		{ key: 'Ctrl/Cmd + Enter', action: 'Run active file' },
		{ key: 'Shift + Alt + F', action: 'Format active file' },
		{ key: 'Ctrl/Cmd + K', action: 'Open command palette' },
		{ key: '?', action: 'Open shortcuts help' },
		{ key: ':', action: 'REPL-like terminal commands' }
	];
</script>

{#if open}
	<div class="fixed inset-0 z-[110] flex items-center justify-center bg-overlay/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
		<div class="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl">
			<div class="flex items-center justify-between border-b border-border px-5 py-4">
				<div class="flex items-center gap-2">
					<Keyboard size={16} class="text-accent" />
					<h2 class="text-base font-bold text-app-fg">Keyboard Shortcuts</h2>
				</div>
				<button type="button" onclick={onClose} class="rounded p-1 text-text-soft hover:bg-surface-elevated hover:text-app-fg">
					<X size={16} />
				</button>
			</div>
			<div class="space-y-2 p-5">
				{#each items as item}
					<div class="flex items-center justify-between rounded-lg border border-border/50 bg-surface px-3 py-2">
						<span class="text-sm text-app-fg">{item.action}</span>
						<kbd class="rounded bg-surface-elevated px-2 py-1 text-xs text-text-muted">{item.key}</kbd>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

