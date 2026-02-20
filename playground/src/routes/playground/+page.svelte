<script>
	import { onMount } from 'svelte';
	import HeaderBar from '$lib/components/playground/HeaderBar.svelte';
	import SidebarExplorer from '$lib/components/playground/SidebarExplorer.svelte';
	import EditorPanel from '$lib/components/playground/EditorPanel.svelte';
	import TerminalPanel from '$lib/components/playground/TerminalPanel.svelte';
	import AstViewerPanel from '$lib/components/playground/AstViewerPanel.svelte';
	import OutputPanel from '$lib/components/playground/OutputPanel.svelte';
	import SettingsModal from '$lib/components/playground/SettingsModal.svelte';
	import ShareModal from '$lib/components/playground/ShareModal.svelte';
	import DeleteConfirmationModal from '$lib/components/playground/DeleteConfirmationModal.svelte';
	import SplitPane from '$lib/components/playground/SplitPane.svelte';
	import LoadingSkeleton from '$lib/components/playground/LoadingSkeleton.svelte';
	import {
		createPlaygroundStore,
		setPlaygroundContext
	} from '$lib/stores/playground.svelte.js';

	const store = createPlaygroundStore();
	setPlaygroundContext(store);

	onMount(() => {
		store.initialize();

		/** @param {KeyboardEvent} e */
		const handleKeydown = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
				e.preventDefault();
				store.runActive();
			}
		};
		window.addEventListener('keydown', handleKeydown);

		return () => {
			store.destroy();
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<svelte:head>
	<title>Mimo Playground</title>
	<meta name="description" content="Advanced multi-panel playground for Mimo." />
</svelte:head>

<div class={store.resolvedTheme === 'dark' ? 'dark' : store.resolvedTheme === 'light' ? 'light' : ''}>
	{#if store.fsStatus === 'initializing'}
		<LoadingSkeleton theme={store.resolvedTheme} />
	{:else}
		<div class="h-screen bg-app-bg text-app-fg">
			<HeaderBar
				sidebarOpen={store.sidebarOpen}
				fsStatus={store.fsStatus}
				onToggleSidebar={() => (store.sidebarOpen = !store.sidebarOpen)}
				onRun={store.runActive}
				onFormat={store.formatActive}
				onShare={store.shareWorkspace}
				onOpenSettings={() => (store.settingsOpen = true)}
			/>

			<main class="h-[calc(100vh-4.5rem)] overflow-hidden">
				{#if store.sidebarOpen}
					<SplitPane orientation="vertical" bind:ratio={store.sidebarRatio} min={14} max={35}>
						{#snippet first()}
													<SidebarExplorer
														tree={store.tree}
														recentFiles={store.recentFiles}
														activeFileId={store.activeTabId}
														selectedNodeId={store.selectedNodeId}
														onSelectFile={store.openFile}
														onSelectNode={store.selectNode}
														onCreateFile={store.createFile}
														onCreateFolder={store.createFolder}
														onRename={store.renameNode}
														onDelete={store.deleteNode}
														onClearRecent={store.clearRecentFiles}
													/>						{/snippet}
						{#snippet second()}
							<SplitPane orientation="vertical" bind:ratio={store.workspaceRatio} min={45} max={80}>
								{#snippet first()}
									<SplitPane orientation="horizontal" bind:ratio={store.centerRatio} min={45} max={80}>
										{#snippet first()}
											<EditorPanel
												tabs={store.tabs}
												activeTabId={store.activeTabId}
												value={store.activeCode}
												selection={store.editorSelection}
												lintMessages={store.lintMessages}
												onSelectTab={store.selectTab}
												onCloseTab={store.closeTab}
												onChange={store.updateActiveCode}
												onFormat={store.formatActive}
												resolvedTheme={store.resolvedTheme}
												fontSize={store.fontSize}
												tabSize={store.tabSize}
											/>
										{/snippet}
										{#snippet second()}
											<TerminalPanel
												entries={store.terminalEntries}
												history={store.commandHistory}
												onRunCommand={store.runCommand}
												onClearLogs={store.clearTerminalLogs}
											/>
										{/snippet}
									</SplitPane>
								{/snippet}
								{#snippet second()}
									<SplitPane orientation="horizontal" bind:ratio={store.rightRatio} min={30} max={70}>
										{#snippet first()}
											<AstViewerPanel
												astData={store.astData}
												astError={store.astError}
												astLoading={store.astLoading}
												onSelectLocation={store.jumpToLocation}
											/>
										{/snippet}
										{#snippet second()}
											<OutputPanel
												output={store.outputLines}
												errors={store.errors}
												warnings={store.warnings}
												onClearTab={store.clearOutputTab}
											/>
										{/snippet}
									</SplitPane>
								{/snippet}
							</SplitPane>
						{/snippet}
					</SplitPane>
				{:else}
					<SplitPane orientation="vertical" bind:ratio={store.workspaceRatio} min={45} max={80} className="h-full">
						{#snippet first()}
							<SplitPane orientation="horizontal" bind:ratio={store.centerRatio} min={45} max={80}>
								{#snippet first()}
									<EditorPanel
										tabs={store.tabs}
										activeTabId={store.activeTabId}
										value={store.activeCode}
										selection={store.editorSelection}
										lintMessages={store.lintMessages}
										onSelectTab={store.selectTab}
										onCloseTab={store.closeTab}
										onChange={store.updateActiveCode}
										onFormat={store.formatActive}
										resolvedTheme={store.resolvedTheme}
										fontSize={store.fontSize}
										tabSize={store.tabSize}
									/>
								{/snippet}
								{#snippet second()}
									<TerminalPanel
										entries={store.terminalEntries}
										history={store.commandHistory}
										onRunCommand={store.runCommand}
										onClearLogs={store.clearTerminalLogs}
									/>
								{/snippet}
							</SplitPane>
						{/snippet}
						{#snippet second()}
							<SplitPane orientation="horizontal" bind:ratio={store.rightRatio} min={30} max={70}>
								{#snippet first()}
									<AstViewerPanel
										astData={store.astData}
										astError={store.astError}
										astLoading={store.astLoading}
										onSelectLocation={store.jumpToLocation}
									/>
								{/snippet}
								{#snippet second()}
									<OutputPanel
										output={store.outputLines}
										errors={store.errors}
										warnings={store.warnings}
										onClearTab={store.clearOutputTab}
									/>
								{/snippet}
							</SplitPane>
						{/snippet}
					</SplitPane>
				{/if}
			</main>

			<SettingsModal
				open={store.settingsOpen}
				bind:theme={store.theme}
				bind:fontSize={store.fontSize}
				bind:tabSize={store.tabSize}
				bind:autoSave={store.autoSave}
				bind:lintEnabled={store.lintEnabled}
				onClose={() => (store.settingsOpen = false)}
			/>
					<ShareModal
						open={store.shareOpen}
						shareLink={store.shareLink}
						linkError={store.shareLinkError}
						activeFileCharCount={store.activeCode.length}
						onClose={() => (store.shareOpen = false)}
						onGenerateLink={store.generateShareLink}
						onDownloadZip={store.downloadWorkspaceZip}
						onUploadZip={store.uploadWorkspaceZip}
						onCopyLink={store.copyShareLink}
					/>
					<DeleteConfirmationModal
						open={store.deleteModalOpen}
						nodeId={store.nodeToDelete}
						isFolder={store.isDeletingFolder}
						onClose={() => (store.deleteModalOpen = false)}
						onConfirm={store.confirmDelete}
					/>
		</div>
	{/if}
</div>
