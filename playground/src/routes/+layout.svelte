<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.png';
	import { getPlaygroundContext } from '$lib/stores/playground.svelte.js';

	let { children } = $props();
	const store = getPlaygroundContext();

	$effect(() => {
		if (store?.resolvedTheme) {
			const theme = store.resolvedTheme;
			document.documentElement.classList.remove('light', 'dark');
			document.documentElement.classList.add(theme);
			document.documentElement.style.colorScheme = theme;
		}
	});
</script>

<svelte:head>
	<meta name="theme-color" content="#03091e" />
	<meta name="color-scheme" content="light dark" />
	<link rel="icon" href={favicon} />
</svelte:head>
<div class="contents">
	{@render children()}
</div>
