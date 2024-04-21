<script>
	import { onMount } from 'svelte';
	import { overrideGlobalConsole } from '$lib/js/overide-console.js';
	import '../app.postcss';
	import Sidebar from '$lib/components/sidebar.svelte';

	onMount(overrideGlobalConsole);
</script>

<svelte:head>
	<title>Mimo</title>
	<link rel="icon" type="image/png" href="./web/favicon.ico" />

	<!-- Primary Meta Tags -->
	<title>Mimo — a simple programming language written in js.</title>
	<meta name="title" content="Mimo — a simple programming language written in js." />
	<meta
		name="description"
		content="Mimo is a programming language, with it's own built in lexer, parser and interpreter and can convert to multiple languages including javascript."
	/>

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://bethropolis.github.io/mimo/" />
	<meta property="og:title" content="Mimo — a simple programming language written in js." />
	<meta
		property="og:description"
		content="Mimo is a programming language, with it's own built in lexer, parser and interpreter and can convert to multiple languages including javascript."
	/>
	<meta property="og:image" content="https://bethropolis.github.io/mimo/web/mimo-banner.png" />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://bethropolis.github.io/mimo/" />
	<meta property="twitter:title" content="Mimo — a simple programming language written in js." />
	<meta
		property="twitter:description"
		content="Mimo is a programming language, with it's own built in lexer, parser and interpreter and can convert to multiple languages including javascript."
	/>
	<meta property="twitter:image" content="https://bethropolis.github.io/mimo/web/mimo-banner.png" />
</svelte:head>

<main>
	<Sidebar />
	<slot />
</main>
