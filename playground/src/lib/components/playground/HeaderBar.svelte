<script>
	import { onMount } from 'svelte';
	import PanelLeftOpen from '@lucide/svelte/icons/panel-left-open';
	import PanelLeftClose from '@lucide/svelte/icons/panel-left-close';
	import Play from '@lucide/svelte/icons/play';
	import AlignLeft from '@lucide/svelte/icons/align-left';
	import Share2 from '@lucide/svelte/icons/share-2';
	import Settings from '@lucide/svelte/icons/settings';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Command from '@lucide/svelte/icons/command';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Keyboard from '@lucide/svelte/icons/keyboard';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';

	let {
		sidebarOpen = true,
		fsStatus = 'initializing',
		onToggleSidebar,
		onRun,
		onFormat,
		onShare,
		onOpenSettings,
		onOpenExamples,
		onOpenPalette,
		onOpenShortcuts
	} = $props();

	let toolsOpen = $state(false);
	let toolsRootEl = $state(/** @type {HTMLElement | null} */ (null));

	const buttonClass =
		'inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-app-fg hover:bg-surface-elevated';

	/** @param {(() => void) | undefined} action */
	function runAction(action) {
		toolsOpen = false;
		action?.();
	}

	onMount(() => {
		/** @param {PointerEvent} event */
		const handlePointerDown = (event) => {
			if (!toolsOpen || !toolsRootEl) return;
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (!toolsRootEl.contains(target)) {
				toolsOpen = false;
			}
		};

		/** @param {KeyboardEvent} event */
		const handleKeyDown = (event) => {
			if (event.key === 'Escape') {
				toolsOpen = false;
			}
		};

		window.addEventListener('pointerdown', handlePointerDown, true);
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('pointerdown', handlePointerDown, true);
			window.removeEventListener('keydown', handleKeyDown);
		};
	});
</script>

<header class="relative z-40 flex items-center justify-between gap-3 border-b border-border bg-panel px-4 py-3 backdrop-blur">
	<div class="flex items-center gap-2">
		<button type="button" onclick={onToggleSidebar} class={buttonClass}>
			{#if sidebarOpen}
				<PanelLeftClose size={16} strokeWidth={2} />
			{:else}
				<PanelLeftOpen size={16} strokeWidth={2} />
			{/if}
			<span class="hidden md:inline">Explorer</span>
		</button>
		<div class="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
			<span class="rounded-md bg-accent px-2 py-1 text-xs font-semibold tracking-[0.2em] text-accent-contrast">MIMO</span>
			<p class="hidden text-xs tracking-[0.14em] text-text-soft md:block">PLAYGROUND</p>
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
		<a
			href="https://bethropolis.github.io/mimo/"
			target="_blank"
			rel="noreferrer"
			class={buttonClass}
			title="Open Docs"
		>
			<BookOpen size={16} strokeWidth={2} />
			<span class="hidden md:inline">Docs</span>
		</a>
		<button
			type="button"
			onclick={onRun}
			title="Run Code (Ctrl + Enter)"
			class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
		>
			<Play size={16} strokeWidth={2.4} />
			<span>Run</span>
			<kbd class="hidden rounded bg-emerald-700/50 px-1 text-[10px] font-medium opacity-80 lg:inline-block">Ctrl+Enter</kbd>
		</button>
		<button
			type="button"
			onclick={onFormat}
			title="Format Code (Shift + Alt + F)"
			class={buttonClass}
		>
			<AlignLeft size={16} strokeWidth={2} />
			<span class="hidden lg:inline">Format</span>
		</button>
		<div class="relative" bind:this={toolsRootEl}>
			<button
				type="button"
				class={buttonClass}
				title="Tools"
				aria-haspopup="menu"
				aria-expanded={toolsOpen}
				onclick={() => (toolsOpen = !toolsOpen)}
			>
				<SlidersHorizontal size={16} strokeWidth={2} />
				<span class="hidden md:inline">Tools</span>
			</button>
			{#if toolsOpen}
				<div class="absolute right-0 top-[calc(100%+0.45rem)] z-50 w-56 rounded-xl border border-border bg-panel p-1.5 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
					<button type="button" class="menu-item" onclick={() => runAction(onShare)}>
						<Share2 size={14} /> Share
					</button>
					<button type="button" class="menu-item" onclick={() => runAction(onOpenExamples)}>
						<Sparkles size={14} /> Examples
					</button>
					<button type="button" class="menu-item" onclick={() => runAction(onOpenPalette)}>
						<Command size={14} /> Command Palette
					</button>
					<button type="button" class="menu-item" onclick={() => runAction(onOpenShortcuts)}>
						<Keyboard size={14} /> Shortcuts
					</button>
				</div>
			{/if}
		</div>
		<button type="button" onclick={onOpenSettings} class={buttonClass} aria-label="Open settings" title="Settings">
			<Settings size={16} strokeWidth={2} />
		</button>
	</div>
</header>

<style>
	.menu-item {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 0.55rem;
		border-radius: 0.65rem;
		padding: 0.45rem 0.6rem;
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.menu-item:hover {
		background: var(--surface-elevated);
		color: var(--app-fg);
	}
</style>
