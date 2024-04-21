<script>
	import { JsonView } from '@zerodevx/svelte-json-view';

	export let json = [];
</script>

<div class="wrap">
	<div class="bar">
		<div class="title uppercase">AST generated</div>
	</div>
	<JsonView bind:json />
</div>

<style>
	.wrap {
		font-family: monospace;
		font-size: 14px;
		--jsonValStringColor: #0ea5e9;
		background-color: #2a323c;
		overflow: auto;
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
