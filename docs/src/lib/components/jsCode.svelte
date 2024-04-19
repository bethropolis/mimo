<script>
	import Editor from 'sveditor';
	import Prism from '$lib/js/mimo-definition.js';
	import 'dracula-prism/dist/css/dracula-prism.min.css';

	export let source = `console.log("Hello, World!")`;

	function update(event) {
		event.detail.output.innerHTML = Prism.highlight(source, Prism.languages.js, 'mimo');
	}
</script>

<div class="jscode">
	<div class="js-bar">
		<div class="title">javascript code</div>
	</div>
	<Editor
		bind:source
		fontFamily="monospace"
		fontSize="0.7rem"
		width="100%"
		height="100dvh"
		background="#2A323C"
		class="my-editor"
		outputClass="mimo"
		on:update={update}
	/>
</div>

<style>
    .jscode{
        width: 100dvh;
    }

    .js-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 2px 16px;
        background-color: #1e2228;
    }

    .title{
        
    }
</style>