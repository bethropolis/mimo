<script>
	import Sun from '@lucide/svelte/icons/sun';
	import Type from '@lucide/svelte/icons/type';
	import Code from '@lucide/svelte/icons/code';
	import Save from '@lucide/svelte/icons/save';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import X from '@lucide/svelte/icons/x';

	let {
		open = false,
		theme = $bindable('system'),
		fontSize = $bindable(14),
		tabSize = $bindable(2),
		autoSave = $bindable(true),
		lintEnabled = $bindable(true),
		onClose
	} = $props();

	const optionClass =
		'rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none transition-all';
	const labelClass = 'flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-text-soft';
</script>

{#if open}
	<div class="fixed inset-0 z-[100] flex items-center justify-center bg-overlay p-4 backdrop-blur-md" role="dialog" aria-modal="true">
		<div class="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-panel shadow-2xl animate-in fade-in zoom-in duration-200">
			<div class="flex items-center justify-between border-b border-border/50 bg-surface/50 px-6 py-4">
				<h2 class="text-lg font-bold tracking-tight text-app-fg">Playground Settings</h2>
				<button
					type="button"
					onclick={onClose}
					class="rounded-full p-2 text-text-soft hover:bg-surface-elevated hover:text-app-fg transition-colors"
				>
					<X size={20} />
				</button>
			</div>

			<div class="p-6 space-y-6">
				<section>
					<label for="theme-select" class={labelClass}>
						<Sun size={14} />
						Theme
					</label>
					<select id="theme-select" bind:value={theme} class={`${optionClass} w-full text-app-fg`}>
						<option value="system">System Preference</option>
						<option value="dark">Dark Mode</option>
						<option value="light">Light Mode</option>
					</select>
				</section>

				<section>
					<div class="flex items-center justify-between mb-2">
						<label for="font-size" class={labelClass}>
							<Type size={14} />
							Font Size
						</label>
						<span class="rounded-lg bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">{fontSize}px</span>
					</div>
					<input id="font-size" bind:value={fontSize} type="range" min="12" max="20" class="w-full accent-accent" />
				</section>

				<section>
					<label for="tab-size" class={labelClass}>
						<Code size={14} />
						Tab Size
					</label>
					<select id="tab-size" bind:value={tabSize} class={`${optionClass} w-full text-app-fg`}>
						<option value={2}>2 spaces (Recommended)</option>
						<option value={4}>4 spaces</option>
						<option value={8}>8 spaces</option>
					</select>
				</section>

				<section>
					<label class="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-surface-elevated transition-colors">
						<div class="flex items-center gap-3">
							<div class="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
								<Save size={18} />
							</div>
							<div>
								<p class="text-sm font-semibold text-app-fg">Auto-save</p>
								<p class="text-[10px] text-text-soft">Persist changes to local storage</p>
							</div>
						</div>
						<input type="checkbox" bind:checked={autoSave} class="h-5 w-5 rounded border-border bg-panel text-accent focus:ring-accent" />
					</label>
				</section>

				<section>
					<label class="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-surface-elevated transition-colors">
						<div class="flex items-center gap-3">
							<div class="rounded-lg bg-amber-500/10 p-2 text-amber-500">
								<AlertTriangle size={18} />
							</div>
							<div>
								<p class="text-sm font-semibold text-app-fg">Linting</p>
								<p class="text-[10px] text-text-soft">Show warnings in editor</p>
							</div>
						</div>
						<input type="checkbox" bind:checked={lintEnabled} class="h-5 w-5 rounded border-border bg-panel text-accent focus:ring-accent" />
					</label>
				</section>
			</div>

			<div class="flex items-center justify-between border-t border-border/50 bg-surface/50 px-6 py-4">
				<button
					type="button"
					onclick={() => {
						theme = 'system';
						fontSize = 14;
						tabSize = 2;
						autoSave = true;
						lintEnabled = true;
					}}
					class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-text-soft hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
				>
					<RotateCcw size={14} />
					Reset Defaults
				</button>
				<button
					type="button"
					onclick={onClose}
					class="rounded-xl bg-accent px-6 py-2 text-sm font-bold text-accent-contrast shadow-lg shadow-accent/20 hover:brightness-110 active:scale-95 transition-all"
				>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}
