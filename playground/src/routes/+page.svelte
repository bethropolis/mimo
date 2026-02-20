<script>
	import mascot from '$lib/assets/mascot.png';
	import GradientText from '$lib/components/landing/gradientText.svelte';

	let prefersDark = $state(false);

	$effect(() => {
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const apply = () => (prefersDark = media.matches);
		apply();
		media.addEventListener('change', apply);
		return () => media.removeEventListener('change', apply);
	});
</script>

<svelte:head>
	<title>Mimo | Prefix Language</title>
	<meta name="description" content="A minimal prefix-notation programming language" />
</svelte:head>

<div class={prefersDark ? 'dark' : ''}>
	<div class="min-h-screen bg-app-bg text-app-fg">
		<div class="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-6">
			<header class="flex items-center justify-between">
				<span class="text-sm font-bold tracking-widest text-accent">MIMO</span>
				<nav class="flex items-center gap-4 text-sm">
					<a href="/playground" class="text-text-muted hover:text-app-fg transition-colors">Playground</a>
					<a href="https://bethropolis.github.io/mimo/" target="_blank" rel="noreferrer" class="text-text-muted hover:text-app-fg transition-colors">Docs</a>
					<a href="https://github.com/bethropolis/mimo" target="_blank" rel="noreferrer" class="text-text-muted hover:text-app-fg transition-colors">GitHub</a>
				</nav>
			</header>

			<main class="flex flex-1 flex-col items-center justify-center gap-8 py-12">
				<img src={mascot} alt="Mimo mascot" class="h-32 w-32" />
				
				<div class="text-center">
					<h1 class="text-3xl font-bold"><GradientText>Mimo</GradientText></h1>
					<p class="mt-2 text-text-muted">A minimal prefix-notation language</p>
				</div>

				<div class="w-full max-w-md rounded-xl border border-border bg-surface p-4">
					<div class="mb-3 flex items-center justify-between text-xs">
						<span class="text-text-soft">example.mimo</span>
						<span class="text-accent">prefix notation</span>
					</div>
					<pre class="font-mono text-sm leading-relaxed"><code><span class="text-purple-500">function</span> <span class="text-sky-400">add</span><span class="text-text-muted">(</span><span class="text-amber-400">a</span><span class="text-text-muted">, </span><span class="text-amber-400">b</span><span class="text-text-muted">)</span>
  <span class="text-purple-500">return</span> <span class="text-emerald-400">+</span> <span class="text-amber-400">a</span> <span class="text-amber-400">b</span>
<span class="text-purple-500">end</span>

<span class="text-purple-500">call</span> <span class="text-sky-400">add</span><span class="text-text-muted">(</span><span class="text-rose-400">4</span><span class="text-text-muted">, </span><span class="text-rose-400">8</span><span class="text-text-muted">) -> </span><span class="text-amber-400">result</span>
<span class="text-purple-500">show</span> <span class="text-amber-400">result</span>  <span class="text-text-soft">// 12</span></code></pre>
				</div>

				<div class="flex gap-3">
					<a
						href="/playground"
						class="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-accent-contrast hover:brightness-110 transition-all"
					>
						Try Playground
					</a>
					<a
						href="https://github.com/bethropolis/mimo"
						target="_blank"
						rel="noreferrer"
						class="rounded-xl border border-border bg-surface px-6 py-2.5 text-sm font-medium hover:bg-surface-elevated transition-colors"
					>
						View Source
					</a>
				</div>
			</main>
		</div>
	</div>
</div>
