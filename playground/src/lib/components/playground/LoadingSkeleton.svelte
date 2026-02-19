<script>
	let { theme = 'dark' } = $props();
</script>

<div class={`flex h-screen flex-col overflow-hidden bg-app-bg text-app-fg ${theme === 'dark' ? 'dark' : ''}`}>
	<!-- Header Skeleton -->
	<header class="flex items-center justify-between border-b border-border bg-panel px-4 py-3">
		<div class="flex items-center gap-2">
			<div class="h-9 w-28 animate-pulse rounded-xl bg-surface-elevated"></div>
			<div class="h-9 w-32 animate-pulse rounded-xl bg-surface-elevated"></div>
		</div>
		<div class="flex items-center gap-2">
			<div class="h-9 w-20 animate-pulse rounded-xl bg-surface-elevated"></div>
			<div class="h-9 w-20 animate-pulse rounded-xl bg-surface-elevated"></div>
			<div class="h-9 w-9 animate-pulse rounded-xl bg-surface-elevated"></div>
		</div>
	</header>

	<main class="flex flex-1 overflow-hidden">
		<!-- Sidebar Skeleton -->
		<div class="w-64 border-r border-border bg-panel p-4">
			<div class="mb-6 h-4 w-20 animate-pulse rounded bg-surface-elevated"></div>
			<div class="space-y-3">
				{#each Array(8) as _}
					<div class="flex items-center gap-2">
						<div class="h-4 w-4 animate-pulse rounded bg-surface-elevated"></div>
						<div class="h-4 flex-1 animate-pulse rounded bg-surface-elevated"></div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Main Content Skeleton -->
		<div class="flex flex-1 flex-col overflow-hidden">
			<!-- Tabs Skeleton -->
			<div class="flex items-center gap-2 border-b border-border/50 bg-surface px-4 py-2">
				<div class="h-8 w-24 animate-pulse rounded-t bg-surface-elevated"></div>
				<div class="h-8 w-24 animate-pulse rounded-t bg-surface-elevated opacity-50"></div>
				<div class="h-8 w-24 animate-pulse rounded-t bg-surface-elevated opacity-30"></div>
			</div>

			<div class="flex flex-1 overflow-hidden">
				<!-- Editor Skeleton -->
				<div class="flex flex-[1.5] flex-col p-4">
					<div class="h-4 w-3/4 animate-pulse rounded bg-surface-elevated"></div>
					<div class="mt-4 h-4 w-1/2 animate-pulse rounded bg-surface-elevated"></div>
					<div class="mt-4 h-4 w-2/3 animate-pulse rounded bg-surface-elevated"></div>
					<div class="mt-4 h-4 w-3/4 animate-pulse rounded bg-surface-elevated"></div>
				</div>

				<!-- Right Panels Skeleton -->
				<div class="flex flex-1 flex-col border-l border-border bg-panel-alt/30">
					<div class="h-1/2 border-b border-border p-4">
						<div class="mb-4 h-4 w-24 animate-pulse rounded bg-surface-elevated"></div>
						<div class="space-y-2">
							<div class="h-3 w-full animate-pulse rounded bg-surface-elevated"></div>
							<div class="h-3 w-full animate-pulse rounded bg-surface-elevated"></div>
							<div class="h-3 w-full animate-pulse rounded bg-surface-elevated"></div>
						</div>
					</div>
					<div class="h-1/2 p-4">
						<div class="mb-4 h-4 w-24 animate-pulse rounded bg-surface-elevated"></div>
						<div class="h-20 w-full animate-pulse rounded bg-surface-elevated"></div>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>
