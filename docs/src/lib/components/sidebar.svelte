<script>
	import Terminal from './icons/terminal.svelte';
	import Github from './icons/github.svelte';
	import Home from './icons/home.svelte';
</script>

<div class="drawer z-50">
	<input id="my-drawer" type="checkbox" value="true" class="drawer-toggle" />
	<div class="drawer-side">
		<label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
		<ul class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
			<!-- Sidebar content here -->
			<li><a href="./"><Home class="h-6 w-6"/>Home</a></li>
			<li><a href="./"><Terminal class="h-6 w-6"/>Playground</a></li>

			<li><a href="https://github.com/bethropolis/mimo"><Github  class="h-6 w-6"/>GitHub</a></li>
		</ul>

		<div class="absolute text-center bottom-0 p-4">
			made with 💜 <a href="https://bethropolis.github.io/" class="text-blue-300" target="_blank"
				>bethropolis</a
			>
		</div>
	</div>
</div>
