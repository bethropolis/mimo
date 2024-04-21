<script>
		  import { base } from "$app/paths";
	import GradientText from './../lib/components/gradientText.svelte';
	import Side from '$lib/components/icons/side.svelte';
	import Prism from '$lib/js/mimo-definition.js';
	import 'prismjs/themes/prism-tomorrow.min.css';

	// Add your programming language syntax here
	const languageSyntax = `
function add(a,b)
  return + a b
endfunction

set x 5
set y 2

call add(x,y) -> result
show result`;

	const highlightedCode = Prism.highlight(languageSyntax, Prism.languages.mimo, 'mimo');
</script>

<main class="w-screen h-screen">
	<div class="flex justify-center pt-4">
		<img src="{base}/web/mimo.png" alt="" class="w-32 h-32" />
	</div>
	<div class="head">
		<h1><GradientText>Mimo</GradientText> programming language</h1>
	</div>
	<div>
		<div class="mockup-code">
			<pre class="px-4"><code>{@html highlightedCode}</code></pre>
		</div>

		<div class="p-4">
			<a href="./playground/">
				<button
					class="btn btn-sm bg-blue-400 uppercase text-black hover:bg-blue-500 md:btn-md lg:btn-lg"
					>Try it!</button
				></a
			>
		</div>
	</div>

	<label
		for="my-drawer"
		class="fixed z-30 bottom-2 left-2 md:bottom-8 md:left-8 flex items-center bg-base-300 rounded-full p-3 shadow-md cursor-pointer transition-transform duration-300 hover:scale-105"
	>
		<div class="lg:tooltip" data-tip="open drawer">
			<Side class="h-6 w-6 text-gray-200 select-none" />
		</div>
	</label>
	<footer class="absolute w-full bottom-0 py-4">
		made with 💜 <a href="https://bethropolis.github.io/" class="text-blue-300" target="_blank"
			>bethropolis</a
		>
	</footer>
</main>

<style>
	main {
		@apply text-center;
	}

	.mockup-code {
		@apply min-w-[300px] max-w-[500px] mx-auto text-left;
	}

	h1 {
		@apply text-5xl font-bold p-8;
	}


</style>
