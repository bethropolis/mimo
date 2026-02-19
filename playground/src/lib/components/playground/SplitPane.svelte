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
	let lineClass = $derived(orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full');
	let handleClass = $derived(
		orientation === 'vertical'
			? 'h-12 w-3 -translate-x-1/2 cursor-col-resize'
			: 'h-3 w-12 -translate-y-1/2 cursor-row-resize'
	);
</script>

<div bind:this={containerEl} class={`relative flex h-full w-full ${axisClass} ${className}`}>
	<section style={sizeStyle} class="min-w-0 min-h-0 overflow-hidden">
		{@render first?.()}
	</section>
	<div class={`relative shrink-0 bg-border/35 ${lineClass}`}>
		<button
			type="button"
			aria-label="Resize panel"
			onpointerdown={startDrag}
			class={`group absolute left-1/2 top-1/2 grid place-items-center rounded-full border border-border/70 bg-surface shadow-sm hover:bg-handle-hover ${handleClass}`}
		>
			{#if orientation === 'vertical'}
				<span class="grid grid-cols-2 gap-0.5">
					<span class="h-0.5 w-0.5 rounded-full bg-text-soft"></span>
					<span class="h-0.5 w-0.5 rounded-full bg-text-soft"></span>
					<span class="h-0.5 w-0.5 rounded-full bg-text-soft"></span>
					<span class="h-0.5 w-0.5 rounded-full bg-text-soft"></span>
					<span class="h-0.5 w-0.5 rounded-full bg-text-soft"></span>
					<span class="h-0.5 w-0.5 rounded-full bg-text-soft"></span>
				</span>
			{:else}
				<span class="grid grid-flow-col gap-0.5">
					<span class="h-0.5 w-0.5 rounded-full bg-text-soft"></span>
					<span class="h-0.5 w-0.5 rounded-full bg-text-soft"></span>
					<span class="h-0.5 w-0.5 rounded-full bg-text-soft"></span>
					<span class="h-0.5 w-0.5 rounded-full bg-text-soft"></span>
					<span class="h-0.5 w-0.5 rounded-full bg-text-soft"></span>
					<span class="h-0.5 w-0.5 rounded-full bg-text-soft"></span>
				</span>
			{/if}
		</button>
	</div>
	<section class="min-w-0 min-h-0 flex-1 overflow-hidden">
		{@render second?.()}
	</section>
</div>
