<script>
	  import { base } from "$app/paths";
	import Terminal from './icons/terminal.svelte';
	import Github from './icons/github.svelte';
	import Home from './icons/home.svelte';
	import Book from './icons/book.svelte';
</script>

<div class="drawer z-50">
	<input id="my-drawer" type="checkbox" value="true" class="drawer-toggle" />
	<div class="drawer-side">
		<label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
		<ul class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
			<!-- Sidebar content here -->
			<li><a href="{base}/"><Home class="h-6 w-6"/>Home</a></li>
			<li><a href="{base}/playground"><Terminal class="h-6 w-6"/>Playground</a></li>
			<li><a href="https://github.com/bethropolis/mimo/blob/main/docs.md" target="_blank"><Book  class="h-6 w-6"/>Docs</a></li>
			<li><a href="https://github.com/bethropolis/mimo" target="_blank"><Github  class="h-6 w-6"/>GitHub</a></li>
		</ul>

		<div class="absolute text-center bottom-0 p-4">
			made with 💜 <a href="https://bethropolis.github.io/" class="text-blue-300" target="_blank"
				>bethropolis</a
			>
		</div>
	</div>
</div>
