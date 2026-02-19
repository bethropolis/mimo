<script>
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
	<title>Mimo | Modern Prefix Language</title>
	<meta
		name="description"
		content="Mimo is a minimal prefix-notation language. Explore the docs and launch the browser playground."
	/>
</svelte:head>

<div class={prefersDark ? 'dark' : ''}>
	<div class="min-h-screen bg-zinc-100 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
		<div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 md:px-10">
		<header class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<span class="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900">MIMO</span>
				<p class="text-xs tracking-[0.2em] text-zinc-500 dark:text-zinc-400">PREFIX LANGUAGE TOOLKIT</p>
			</div>
			<a
				href="/playground"
				class="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
			>
				Open Playground
			</a>
		</header>

		<main class="grid flex-1 items-center gap-10 py-12 md:grid-cols-[1.2fr_1fr] md:py-16">
			<section class="space-y-8">
				<p class="text-xs font-medium tracking-[0.24em] text-zinc-500 dark:text-zinc-400">MODERN + MINIMAL</p>
				<h1 class="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
					A small language for learning parser and interpreter design.
				</h1>
				<p class="max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300 md:text-lg">
					Mimo keeps syntax consistent with prefix notation and gives you practical tooling to iterate fast.
					Build expressions, functions, modules, and test behavior directly from the web playground.
				</p>
				<div class="flex flex-wrap gap-3">
					<a
						href="/playground"
						class="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-zinc-100 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
					>
						Launch Playground
					</a>
					<a
						href="https://github.com/bethropolis/mimo"
						target="_blank"
						rel="noreferrer"
						class="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
					>
						GitHub
					</a>
				</div>
			</section>

			<section class="rounded-2xl border border-zinc-300 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<div class="mb-4 flex items-center justify-between">
					<p class="font-mono text-xs tracking-[0.2em] text-zinc-500">SNIPPET</p>
					<span class="rounded-lg border border-zinc-300 px-2 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">.mimo</span>
				</div>
				<pre class="overflow-x-auto rounded-xl bg-zinc-100 p-4 text-sm leading-relaxed text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"><code>function add(a, b)
  return + a b
end

call add(4, 8) -> result
show result</code></pre>
			</section>
		</main>
		</div>
	</div>
</div>
