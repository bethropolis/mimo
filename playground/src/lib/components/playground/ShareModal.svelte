<script>
	let {
		open = false,
		shareLink = '',
		linkError = '',
		onClose,
		onGenerateLink,
		onDownloadZip,
		onCopyLink
	} = $props();
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
		<div class="w-full max-w-lg rounded-2xl border border-border bg-panel p-5 shadow-2xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Share Playground</h2>
				<button
					type="button"
					onclick={onClose}
					class="rounded-lg border border-border px-2 py-1 text-sm hover:bg-surface-elevated"
				>
					Close
				</button>
			</div>

			<div class="space-y-3">
				<div class="rounded-xl border border-border bg-surface p-3">
					<p class="mb-2 text-sm font-medium">Download Workspace</p>
					<p class="mb-3 text-xs text-text-muted">Export all files as `mimo-workspace.zip`.</p>
					<button
						type="button"
						onclick={onDownloadZip}
						class="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-contrast hover:brightness-110"
					>
						Download ZIP
					</button>
				</div>

				<div class="rounded-xl border border-border bg-surface p-3">
					<p class="mb-2 text-sm font-medium">Share Active File</p>
					<p class="mb-3 text-xs text-text-muted">Generate a URL containing the current file content encoded as base64.</p>
					<div class="mb-2 flex gap-2">
						<button
							type="button"
							onclick={onGenerateLink}
							class="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-contrast hover:brightness-110"
						>
							Generate Link
						</button>
						<button
							type="button"
							onclick={onCopyLink}
							disabled={!shareLink}
							class="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-surface-muted"
						>
							Copy Link
						</button>
					</div>
					{#if linkError}
						<p class="mb-2 text-xs text-rose-500">{linkError}</p>
					{/if}
					<input
						type="text"
						readonly
						value={shareLink}
						placeholder="Generated link appears here"
						class="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs text-text-muted"
					/>
				</div>
			</div>
		</div>
	</div>
{/if}
