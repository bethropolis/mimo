<script>
	import Editor from 'sveditor';
	import Prism from '$lib/js/mimo-definition.js';
	import "dracula-prism/dist/css/dracula-prism.min.css";


    let source = `console.log("Hello, World!")`;

	function update(event) {    
		event.detail.output.innerHTML = Prism.highlight(source, Prism.languages.js, 'mimo');
	}
</script>

<Editor
bind:source
fontFamily="monospace"
fontSize="0.7rem"
width="100%"
height="50vh"
background="#2A323C"
class="my-editor"
outputClass="mimo"
on:update={update}
 />

