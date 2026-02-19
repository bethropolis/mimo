<script>
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';

	let {
		open = false,
		nodeId = '',
		isFolder = false,
		onClose,
		onConfirm
	} = $props();

	let fileName = $derived(nodeId.split('/').pop() || nodeId);
</script>

{#if open}
	<div class="fixed inset-0 z-[60] flex items-center justify-center bg-overlay p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
		<div class="w-full max-w-sm rounded-2xl border border-border bg-panel p-6 shadow-2xl">
			<div class="mb-4 flex items-center gap-3 text-rose-500">
				<div class="rounded-full bg-rose-500/10 p-2">
					<AlertTriangle size={24} />
				</div>
				<h2 class="text-lg font-semibold text-app-fg">Delete {isFolder ? 'Folder' : 'File'}?</h2>
			</div>

			<p class="mb-6 text-sm text-text-muted leading-relaxed">
				Are you sure you want to delete <span class="font-mono font-bold text-app-fg">"{fileName}"</span>? 
				{#if isFolder}
					All files inside this folder will be permanently removed.
				{/if}
				This action cannot be undone.
			</p>

			<div class="flex items-center justify-end gap-3">
				<button
					type="button"
					onclick={onClose}
					class="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-elevated"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={() => {
						onConfirm(nodeId);
						onClose();
					}}
					class="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
				>
					Delete
				</button>
			</div>
		</div>
	</div>
{/if}
