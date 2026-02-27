<script>
	import X from '@lucide/svelte/icons/x';
	import Rocket from '@lucide/svelte/icons/rocket';

	let {
		open = false,
		onClose,
		onLoadExample
	} = $props();

	const examples = [
		{ id: 'inventory', title: 'Inventory', desc: 'Modules + loops + template literals' },
		{ id: 'regex', title: 'Regex', desc: 'Pattern extraction and replacement flow' },
		{ id: 'modules', title: 'Modules', desc: 'Small multi-file import/export setup' },
		{ id: 'decorators', title: 'Decorators', desc: 'Function wrappers with @decorator syntax' }
	];
</script>

{#if open}
	<div class="fixed inset-0 z-[110] flex items-center justify-center bg-overlay/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
		<div class="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl">
			<div class="flex items-center justify-between border-b border-border px-5 py-4">
				<h2 class="text-base font-bold text-app-fg">Load Example Workspace</h2>
				<button type="button" onclick={onClose} class="rounded p-1 text-text-soft hover:bg-surface-elevated hover:text-app-fg">
					<X size={16} />
				</button>
			</div>
			<div class="grid gap-3 p-5 sm:grid-cols-2">
				{#each examples as ex}
					<button
						type="button"
						onclick={() => onLoadExample?.(ex.id)}
						class="rounded-xl border border-border bg-surface px-4 py-3 text-left hover:bg-surface-elevated"
					>
						<div class="mb-2 flex items-center gap-2">
							<Rocket size={14} class="text-accent" />
							<span class="font-semibold text-app-fg">{ex.title}</span>
						</div>
						<p class="text-xs text-text-soft">{ex.desc}</p>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

