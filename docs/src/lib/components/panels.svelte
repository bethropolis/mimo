<script>
	import { PaneGroup, Pane, PaneResizer } from 'paneforge';
	import Resize from './icons/resize.svelte';
</script>

<PaneGroup direction="horizontal">
	<Pane defaultSize={50}>
		<PaneGroup direction="vertical">
			<Pane defaultSize={50}><slot name="mimo"></slot></Pane>
			<PaneResizer class="relative flex h-1 items-center justify-center bg-background">
				<div class="z-10 flex h-2 w-4 items-center justify-center rounded-sm bg-brand">
					<Resize class="size-4 text-black  rotate-90" weight="bold" />
				</div>
			</PaneResizer>
			<Pane defaultSize={50}><slot name="js"></slot></Pane>
		</PaneGroup>
	</Pane>
	<PaneResizer class="relative flex w-1 items-center justify-center bg-background">
		<div class="z-10 flex h-4 w-2 items-center justify-center rounded-sm bg-brand">
			<Resize class="size-4 text-black" weight="bold" />
		</div>
	</PaneResizer>
	<Pane defaultSize={50}>
		<PaneGroup direction="vertical">
			<Pane defaultSize={50}><slot name="ast"></slot></Pane>
			<PaneResizer class="relative flex h-1 items-center justify-center bg-background">
				<div class="z-10 flex h-2 w-4 items-center justify-center rounded-sm bg-brand">
					<Resize class="size-4 text-black rotate-90" weight="bold" />
				</div>
			</PaneResizer>
			<Pane defaultSize={50}><slot name="console"></slot></Pane>
		</PaneGroup>
	</Pane>
</PaneGroup>
