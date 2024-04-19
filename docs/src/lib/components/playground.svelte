<script>
	import Panels from '$lib/components/panels.svelte';
</script>

<main>
	<Panels>
		<div slot="mimo">
			<slot name="mimo"></slot>
		</div>
		<div slot="ast">
			<slot name="ast"></slot>
		</div>
		<div slot="js">
			<slot name="js"></slot>
		</div>
		<div slot="console">
			<slot name="console"></slot>
		</div>
	</Panels>
</main>

<style>
	main {
		@apply h-screen w-screen;
	}
</style>
