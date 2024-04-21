<script>
	import { onMount } from 'svelte';
	import { overrideGlobalConsole } from '$lib/js/overide-console.js';
	import '../app.css';
	import Sidebar from '$lib/components/sidebar.svelte';

	onMount(overrideGlobalConsole);
</script>


<main>
	<Sidebar />
	<slot />
</main>
