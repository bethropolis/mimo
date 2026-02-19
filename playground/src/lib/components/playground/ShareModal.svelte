<script>
	import Upload from '@lucide/svelte/icons/upload';
	import Download from '@lucide/svelte/icons/download';

	let {
		open = false,
		shareLink = '',
		linkError = '',
		activeFileCharCount = 0,
		onClose,
		onGenerateLink,
		onDownloadZip,
		onUploadZip,
		onCopyLink
	} = $props();

	let linkLength = $derived(shareLink.length);
	let isLinkTooLong = $derived(linkLength > 2000);
	let fileInput = $state(/** @type {HTMLInputElement | null} */(null));

	/** @param {Event} e */
	function handleFileChange(e) {
		const file = /** @type {HTMLInputElement} */(e.target).files?.[0];
		if (file && file.name.endsWith('.zip')) {
			onUploadZip(file);
			/** @type {HTMLInputElement} */(e.target).value = '';
		}
	}
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
					<p class="mb-2 text-sm font-medium">Workspace ZIP</p>
					<p class="mb-3 text-xs text-text-muted">Download or upload a workspace as a ZIP file. Uploading will replace all files.</p>
					<div class="flex gap-2">
						<button
							type="button"
							onclick={onDownloadZip}
							class="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-contrast hover:brightness-110"
						>
							<Download size={14} />
							Download
						</button>
						<button
							type="button"
							onclick={() => fileInput?.click()}
							class="flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm font-semibold hover:bg-surface-muted"
						>
							<Upload size={14} />
							Upload
						</button>
						<input
							type="file"
							accept=".zip"
							bind:this={fileInput}
							onchange={handleFileChange}
							class="hidden"
						/>
					</div>
				</div>

				<div class="rounded-xl border border-border bg-surface p-3">
					<div class="mb-2 flex items-center justify-between">
						<p class="text-sm font-medium">Share Active File</p>
						<span class="text-[10px] text-text-soft">{activeFileCharCount} characters</span>
					</div>
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
					{#if shareLink}
						<div class="mb-1 flex items-center justify-between text-[10px]">
							<span class={isLinkTooLong ? 'text-amber-500' : 'text-text-soft'}>
								URL Length: {linkLength} chars
							</span>
							{#if isLinkTooLong}
								<span class="text-amber-500">Warning: URL may be too long for some browsers</span>
							{/if}
						</div>
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
