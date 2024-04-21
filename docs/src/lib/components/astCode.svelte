<script>
	import { JsonView } from '@zerodevx/svelte-json-view';
	import Collapse from './icons/collapse.svelte';
	import Expand from './icons/expand.svelte';

	/**
	 * An array of JSON objects to be displayed in the JsonView.
	 * @type {Array<Object>}
	 */
	export let json = [];

	let depth = Infinity;
</script>

<div class="wrap">
	<div class="bar">
		<div class="title uppercase">AST generated</div>

		<ul class="list-none flex items-center gap-3">
			{#if depth !== Infinity}
			<li class="tooltip tooltip-bottom" data-tip="expand">
				<button on:click={() => (depth = Infinity)}>
					<Expand
						class="h-5 w-5 hover:text-gray-600 active:scale-95 transition-all duration-300"
					/>
				</button>
			</li>
			{:else}
			<li class="tooltip tooltip-bottom" data-tip="collapse">
				<button on:click={() => (depth = 0)}>
					<Collapse
						class="h-5 w-5 hover:text-gray-600 active:scale-95 transition-all duration-300"
					/>
				</button>
			</li>
			{/if}
		</ul>
	</div>
	<JsonView bind:json {depth} />
</div>

<style>
	.wrap {
		font-family: monospace;
		font-size: 14px;
		--jsonValStringColor: #0ea5e9;
		background-color: #2a323c;
		overflow-y: scroll;
		overflow-x: hidden;
		height: 80vh;
		@apply mb-5;
	}

	.bar {
		position: sticky;
		top: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 5.5px 16px;
		background-color: #1e2228;
	}
</style>
