<script>
	import Editor from 'sveditor';
	import Prism from '$lib/js/mimo-definition.js';
	import "dracula-prism/dist/css/dracula-prism.min.css";


    let source = ``;

	function update(event) {
		event.detail.output.innerHTML = Prism.highlight(source, Prism.languages.mimo, 'mimo');
	}
</script>

<Editor
bind:source
fontFamily="monospace"
fontSize="0.7rem"
width="100%"
height="100vh"
background="#2A323C"
class="my-editor"
outputClass="mimo"
on:update={update}
 />

<style>
 :global(.mimo){
    display: inline-block;
 }
 :global(.content){
    display: flex;
 }
 
</style>
