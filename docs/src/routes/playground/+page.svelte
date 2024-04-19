<script>
	import { onMount } from 'svelte';
	import Mimo from 'mimo-lang';
	import AstCode from '$lib/components/astCode.svelte';
	import Console from '$lib/components/console.svelte';
	import JsCode from '$lib/components/jsCode.svelte';
	import MimoCode from '$lib/components/mimoCode.svelte';
	import Playground from '$lib/components/playground.svelte';

	let source = `function add(a,b)
  return + a b
endfunction

set x 5
set y 2

call add(x,y) -> result
show result`;

	let mimo = new Mimo();

	let ast = []
	let jscode = '';

	async function run() {
		let { program } =await mimo.run(source);
		ast = program;
		console.log(program);
		jscode = mimo.toJS(program);
	}

	onMount(run);
</script>

<Playground>
	<div slot="mimo">
		<MimoCode bind:source />
	</div>
	<div slot="ast">
		<AstCode json={ast}/>
	</div>
	<div slot="js">
		<JsCode bind:source={jscode}/>
	</div>
	<div slot="console">
		<Console />
	</div>
</Playground>

<style>
	/* your styles go here */
</style>
