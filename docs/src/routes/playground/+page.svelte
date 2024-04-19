<script>
	import AstCode from '$lib/components/astCode.svelte';
	import Console from '$lib/components/console.svelte';
	import JsCode from '$lib/components/jsCode.svelte';
	import MimoCode from '$lib/components/mimoCode.svelte';
	import Playground from '$lib/components/playground.svelte';
</script>

<Playground>
	<div slot="mimo">
		<MimoCode />
	</div>
	<div slot="ast">
		<AstCode />
	</div>
	<div slot="js">
		<JsCode />
	</div>
	<div slot="console">
		<Console />
	</div>
</Playground>

<style>
	/* your styles go here */
</style>
