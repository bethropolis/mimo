<script>
	let {
		open = false,
		theme = $bindable('system'),
		fontSize = $bindable(14),
		tabSize = $bindable(2),
		autoSave = $bindable(true),
		onClose
	} = $props();

	const optionClass =
		'rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900';
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
		<div class="w-full max-w-md rounded-2xl border border-zinc-300 bg-zinc-100 p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Playground Settings</h2>
				<button
					type="button"
					onclick={onClose}
					class="rounded-lg border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
				>
					Close
				</button>
			</div>

			<div class="space-y-4">
				<label class="block">
					<p class="mb-1 text-sm text-zinc-600 dark:text-zinc-300">Theme</p>
					<select bind:value={theme} class={`${optionClass} w-full`}>
						<option value="system">System</option>
						<option value="dark">Dark</option>
						<option value="light">Light</option>
					</select>
				</label>

				<label class="block">
					<p class="mb-1 text-sm text-zinc-600 dark:text-zinc-300">Font Size: {fontSize}px</p>
					<input bind:value={fontSize} type="range" min="12" max="20" class="w-full" />
				</label>

				<label class="block">
					<p class="mb-1 text-sm text-zinc-600 dark:text-zinc-300">Tab Size</p>
					<select bind:value={tabSize} class={`${optionClass} w-full`}>
						<option value={2}>2 spaces</option>
						<option value={4}>4 spaces</option>
						<option value={8}>8 spaces</option>
					</select>
				</label>

				<div class="grid grid-cols-1 gap-2">
					<label class="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
						<input type="checkbox" bind:checked={autoSave} /> Auto-save
					</label>
				</div>
			</div>
		</div>
	</div>
{/if}
