<script>
	import PanelLeftOpen from '@lucide/svelte/icons/panel-left-open';
	import PanelLeftClose from '@lucide/svelte/icons/panel-left-close';
	import Play from '@lucide/svelte/icons/play';
	import Share2 from '@lucide/svelte/icons/share-2';
	import Settings from '@lucide/svelte/icons/settings';

	let { sidebarOpen = true, fsStatus = 'initializing', onToggleSidebar, onRun, onShare, onOpenSettings } = $props();

	const buttonClass =
		'inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800';
</script>

<header class="flex items-center justify-between gap-3 border-b border-zinc-200/80 bg-zinc-100/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
	<div class="flex items-center gap-2">
		<button type="button" onclick={onToggleSidebar} class={buttonClass}>
			{#if sidebarOpen}
				<PanelLeftClose size={16} strokeWidth={2} />
			{:else}
				<PanelLeftOpen size={16} strokeWidth={2} />
			{/if}
			<span class="hidden md:inline">Explorer</span>
		</button>
		<div class="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
			<span class="rounded-md bg-zinc-900 px-2 py-1 text-xs font-semibold tracking-[0.2em] text-white dark:bg-zinc-100 dark:text-zinc-900">MIMO</span>
			<p class="hidden text-xs tracking-[0.14em] text-zinc-500 md:block dark:text-zinc-400">PLAYGROUND</p>
			<span
				class={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${
					fsStatus === 'indexeddb'
						? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200'
						: 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200'
				}`}
			>
				{fsStatus === 'indexeddb' ? 'idb' : fsStatus === 'memory' ? 'mem' : 'init'}
			</span>
		</div>
	</div>

	<div class="flex items-center gap-2">
		<button
			type="button"
			onclick={onRun}
			class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
		>
			<Play size={16} strokeWidth={2.4} />
			Run
		</button>
		<button type="button" onclick={onShare} class={buttonClass}>
			<Share2 size={16} strokeWidth={2} />
			<span class="hidden md:inline">Share</span>
		</button>
		<button type="button" onclick={onOpenSettings} class={buttonClass} aria-label="Open settings">
			<Settings size={16} strokeWidth={2} />
		</button>
	</div>
</header>
