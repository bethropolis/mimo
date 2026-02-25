<script>
	import CodeMirror from 'svelte-codemirror-editor';
	import { EditorView } from '@codemirror/view';
	import { linter } from '@codemirror/lint';
	import X from '@lucide/svelte/icons/x';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FileText from '@lucide/svelte/icons/file-text';
	import Folder from '@lucide/svelte/icons/folder';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import { mimoEditorExtensions, mimoLanguage } from '$lib/editor/mimo-language.js';
	import { getMimoTheme } from '$lib/editor/mimo-theme.js';
	import { mimoFormatKeymap } from '$lib/editor/mimo-formatter.js';

	let {
		tabs = [],
		activeTabId = '',
		value = '',
		selection = null,
		lintMessages = [],
		onSelectTab,
		onCloseTab,
		onChange,
		onFormat,
		fontSize = 14,
		tabSize = 2,
		resolvedTheme = 'light'
	} = $props();

	let cursorPos = $state({ line: 1, ch: 1 });
	let editorView = $state(/** @type {EditorView | null} */(null));
	let tabScrollEl = $state(/** @type {HTMLDivElement | null} */(null));

	let editorStyles = $derived({
		'&': {
			height: '100%',
			fontSize: `${fontSize}px`
		}
	});

	let breadcrumbs = $derived(activeTabId.split('/').filter(Boolean));

	$effect(() => {
		if (activeTabId && tabScrollEl) {
			const activeTab = tabScrollEl.querySelector(`[data-tab-id="${activeTabId}"]`);
			if (activeTab) {
				activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
			}
		}
	});

	$effect(() => {
		if (selection && editorView) {
			try {
				const lineCount = editorView.state.doc.lines;
				const targetLine = Math.min(Math.max(1, selection.line), lineCount);
				const line = editorView.state.doc.line(targetLine);
				const pos = line.from + Math.min(Math.max(0, selection.column - 1), line.length);

				editorView.dispatch({
					selection: { anchor: pos, head: pos },
					scrollIntoView: true
				});
				editorView.focus();
			} catch (e) {
				console.error('Failed to jump to selection:', e);
			}
		}
	});

	const selectionExtension = EditorView.updateListener.of((update) => {
		if (update.selectionSet || update.docChanged) {
			const pos = update.state.selection.main.head;
			const line = update.state.doc.lineAt(pos);
			cursorPos = {
				line: line.number,
				ch: pos - line.from + 1
			};
		}
	});

	let editorTheme = $derived(getMimoTheme(resolvedTheme === 'dark' ? 'dark' : 'light'));
	
	// Create a linter that reads from the current lintMessages prop
	let mimoLinter = $derived(linter((view) => {
		const messages = lintMessages ?? [];
		const diagnostics = [];
		
		for (const msg of messages) {
			try {
				const line = Math.max(1, msg.line);
				const lineInfo = view.state.doc.line(line);
				const from = Math.min(lineInfo.from + Math.max(0, msg.column - 1), lineInfo.to);
				const to = Math.min(lineInfo.from + Math.max(0, (msg.endColumn ?? msg.column) - 1), lineInfo.to);
				
				diagnostics.push({
					from,
					to: Math.max(from, to),
					severity: /** @type {'error' | 'warning' | 'info'} */(msg.severity === 'error' ? 'error' : 'warning'),
					message: `${msg.message} (${msg.ruleId})`
				});
			} catch (e) {
				// Skip invalid diagnostics
			}
		}
		
		return diagnostics;
	}));
	
	let formatExtension = $derived(mimoFormatKeymap(onFormat));
	
	let editorExtensions = $derived([
		...mimoEditorExtensions,
		selectionExtension,
		mimoLinter,
		formatExtension,
		...editorTheme
	]);
	
	let warningCount = $derived(lintMessages.filter(m => m.severity === 'warning').length);
	let errorCount = $derived(lintMessages.filter(m => m.severity === 'error').length);
</script>

<section class="flex h-full flex-col border border-border/40 bg-surface">
	<div class="flex items-center justify-between border-b border-border/60 bg-panel-alt/35 px-2 pt-2">
		<div 
			bind:this={tabScrollEl}
			class="flex min-w-0 flex-1 gap-1 overflow-x-auto no-scrollbar scroll-smooth"
			style="mask-image: linear-gradient(to right, black calc(100% - 20px), transparent 100%);"
		>
			{#each tabs as tab (tab.id)}
				<div
					data-tab-id={tab.id}
					class={`group -mb-px inline-flex shrink-0 items-center rounded-t-md border px-3 py-1.5 text-xs transition-colors ${
						tab.id === activeTabId
							? 'border-border-strong border-b-surface bg-surface text-app-fg shadow-[0_-1px_0_0_var(--border)]'
							: 'border-border/40 bg-surface-muted/55 text-text-muted hover:border-border/70 hover:bg-surface hover:text-app-fg'
					}`}
				>
					<button
						type="button"
						onclick={() => onSelectTab(tab.id)}
						class={`max-w-[11rem] truncate ${tab.id === activeTabId ? 'font-semibold' : 'font-medium'}`}
					>
						{tab.name}
					</button>
					<button
						type="button"
						onclick={() => onCloseTab(tab.id)}
						class={`ml-2 rounded px-1 text-text-soft hover:bg-surface-elevated hover:text-app-fg transition-opacity ${
							tab.id === activeTabId ? 'opacity-80 hover:opacity-100' : 'opacity-35 group-hover:opacity-100'
						}`}
						aria-label={`Close ${tab.name}`}
					>
						<X size={12} />
					</button>
				</div>
			{/each}
		</div>
		<p class="ml-3 shrink-0 pb-1 text-xs text-text-soft">tab {tabSize}</p>
	</div>

	<div class="flex items-center gap-1.5 border-b border-border/40 bg-panel-alt/30 px-3 py-1.5">
		<Folder size={12} class="text-text-soft" />
		<div class="flex items-center gap-1">
			{#each breadcrumbs as part, i}
				{#if i > 0}
					<ChevronRight size={10} class="text-text-muted/50" />
				{/if}
				<span class={`text-[10px] ${i === breadcrumbs.length - 1 ? 'font-medium text-app-fg' : 'text-text-soft'}`}>
					{part}
				</span>
			{/each}
		</div>
		{#if activeTabId.endsWith('.mimo')}
			<div class="ml-auto flex items-center gap-1 text-[10px] text-text-muted">
				<FileText size={10} />
				<span>Mimo Source</span>
			</div>
		{/if}
	</div>

	<div class="min-h-0 flex-1 overflow-hidden">
		<CodeMirror
			{value}
			onready={(v) => editorView = v}
			onchange={onChange}
			lang={mimoLanguage}
			tabSize={tabSize}
			lineNumbers={true}
			lineWrapping={false}
			editable={true}
			placeholder="Write Mimo code here"
			extensions={editorExtensions}
			autocompletion={true}
			class="h-full min-h-[22rem] overflow-auto bg-surface"
			styles={editorStyles}
		/>
	</div>

	<div
		class="flex items-center justify-between border-t border-border/50 bg-surface px-3 py-1 text-[10px] text-text-soft"
	>
		<div class="flex items-center gap-4">
			<div class="flex items-center gap-1.5">
				<span>Ln {cursorPos.line}, Col {cursorPos.ch}</span>
			</div>
			<span>{value.length} characters</span>
		</div>
		<div class="flex items-center gap-3">
			{#if errorCount > 0}
				<span class="flex items-center gap-1 text-red-500">
					<AlertCircle size={10} />
					{errorCount}
				</span>
			{/if}
			{#if warningCount > 0}
				<span class="flex items-center gap-1 text-amber-500">
					<AlertTriangle size={10} />
					{warningCount}
				</span>
			{/if}
			<span>Mimo</span>
		</div>
	</div>
</section>
