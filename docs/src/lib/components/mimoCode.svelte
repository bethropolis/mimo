<script>
	import { createEventDispatcher } from 'svelte';
	import Editor from 'sveditor';
	import Prism from '$lib/js/mimo-definition.js';
	import 'dracula-prism/dist/css/dracula-prism.min.css';
	import Play from './icons/play.svelte';
	import Side from './icons/side.svelte';
	import Select from './select.svelte';

	export let source = '';

	const dispatch = createEventDispatcher();

	function update(event) {
		event.detail.output.innerHTML = Prism.highlight(source, Prism.languages.mimo, 'mimo');
	}

	function runCode() {
		dispatch('run');
	}
</script>

<div class="main">
	<div class="bar">
		<div class="title uppercase">Mimo code</div>

		<ul class="list-none flex items-center gap-3">
			<li>
				<Select bind:source/>
			</li>
			<li>
				<label for="my-drawer"
					><Side
						for="my-drawer"
						class="h-5 w-5 hover:text-gray-600 active:scale-95 transition-all duration-300"
					/></label
				>
			</li>
			<li>
				<button class="run btn hover:btn-outline transition-all duration-300" on:click={runCode}
					><Play class="h-5 w-5" /> Run</button
				>
			</li>
		</ul>
	</div>
	<Editor
		bind:source
		fontFamily="monospace"
		fontSize="0.7rem"
		width="100%"
		height="100%"
		background="#2A323C"
		class="mimo-editor" 
		outputClass="mimo"
		on:update={update}
	/>
</div>

<style>
	:global(.mimo) {
		display: inline-block;
	}
	:global(.content) {
		display: flex;
	}

	:global(.mimo-editor) {
		margin-top: 32px;
	}
	.main{
		position: relative;
		height: 100vh;
		@apply mb-5;
	}

	.bar {
		position: sticky;
		top: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 2px 16px;
		background-color: #1e2228;
		@apply py-1;
	}
	.run {
		@apply bg-green-500 flex items-center text-gray-700 py-0 h-6 min-h-6 px-1;
	}
</style>
