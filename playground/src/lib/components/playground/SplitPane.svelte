<script>
	let {
		orientation = 'vertical',
		ratio = $bindable(50),
		min = 15,
		max = 85,
		className = '',
		first,
		second
	} = $props();

	let containerEl = $state();
	let dragging = $state(false);

	/** @param {number} value */
	function clamp(value) {
		return Math.min(max, Math.max(min, value));
	}

	/** @param {PointerEvent} event */
	function startDrag(event) {
		event.preventDefault();
		dragging = true;
	}

	/** @param {PointerEvent} event */
	function handleMove(event) {
		if (!dragging || !containerEl) return;

		const rect = containerEl.getBoundingClientRect();
		const next =
			orientation === 'vertical'
				? ((event.clientX - rect.left) / rect.width) * 100
				: ((event.clientY - rect.top) / rect.height) * 100;

		ratio = clamp(next);
	}

	function stopDrag() {
		dragging = false;
	}

	$effect(() => {
		if (!dragging) return;
		window.addEventListener('pointermove', handleMove);
		window.addEventListener('pointerup', stopDrag);
		return () => {
			window.removeEventListener('pointermove', handleMove);
			window.removeEventListener('pointerup', stopDrag);
		};
	});

	let axisClass = $derived(orientation === 'vertical' ? 'flex-row' : 'flex-col');
	let sizeStyle = $derived(orientation === 'vertical' ? `width:${ratio}%` : `height:${ratio}%`);
	let handleClass = $derived(
		orientation === 'vertical'
			? 'w-1 cursor-col-resize border-x border-zinc-300/60 dark:border-zinc-700/60'
			: 'h-1 cursor-row-resize border-y border-zinc-300/60 dark:border-zinc-700/60'
	);
</script>

<div bind:this={containerEl} class={`relative flex h-full w-full ${axisClass} ${className}`}>
	<section style={sizeStyle} class="min-w-0 min-h-0 overflow-hidden">
		{@render first?.()}
	</section>
	<button
		type="button"
		aria-label="Resize panel"
		onpointerdown={startDrag}
		class={`shrink-0 bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 ${handleClass}`}
	></button>
	<section class="min-w-0 min-h-0 flex-1 overflow-hidden">
		{@render second?.()}
	</section>
</div>
