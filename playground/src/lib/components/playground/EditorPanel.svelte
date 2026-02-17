<script>
	import CodeMirror from 'svelte-codemirror-editor';
	import X from '@lucide/svelte/icons/x';
	import { mimoLanguage } from '$lib/editor/mimo-language.js';

	let {
		tabs = [],
		activeTabId = '',
		value = '',
		onSelectTab,
		onCloseTab,
		onChange,
		fontSize = 14,
		tabSize = 2,
		resolvedTheme = 'light'
	} = $props();

	let isDark = $derived(resolvedTheme === 'dark');
	let editorStyles = $derived({
		'&': {
			height: '100%',
			fontSize: `${fontSize}px`,
			backgroundColor: isDark ? '#0b1220' : '#f8fafc',
			color: isDark ? '#e7e9ee' : '#0f172a'
		},
		'.cm-content': {
			caretColor: isDark ? '#a5d6ff' : '#0f172a'
		},
		'.cm-cursor, .cm-dropCursor': {
			borderLeftColor: isDark ? '#a5d6ff' : '#0f172a'
		},
		'.cm-activeLine': {
			backgroundColor: isDark ? '#121b2e' : '#eff6ff'
		},
		'.cm-selectionBackground, .cm-content ::selection': {
			backgroundColor: isDark ? '#25314a' : '#dbeafe'
		},
		'.cm-gutters': {
			backgroundColor: isDark ? '#0f1728' : '#f1f5f9',
			color: isDark ? '#8f9bb0' : '#475569',
			borderRight: `1px solid ${isDark ? '#1f2a3d' : '#d8dee9'}`
		},
		'.cm-activeLineGutter': {
			backgroundColor: isDark ? '#17233a' : '#e2e8f0',
			color: isDark ? '#cbd5e1' : '#1e293b'
		}
	});
</script>

<section class="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
	<div class="flex items-center justify-between border-b border-zinc-200 px-2 pt-2 dark:border-zinc-800">
		<div class="flex min-w-0 flex-1 gap-0 overflow-auto">
			{#each tabs as tab (tab.id)}
				<div
					class={`group -mb-px inline-flex items-center border-x border-t px-3 py-1.5 text-xs ${
						tab.id === activeTabId
							? 'rounded-t-md border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
							: 'border-transparent bg-zinc-100 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800'
					}`}
				>
					<button type="button" onclick={() => onSelectTab(tab.id)} class="max-w-[10rem] truncate">{tab.name}</button>
					<button
						type="button"
						onclick={() => onCloseTab(tab.id)}
						class="ml-2 rounded px-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
						aria-label={`Close ${tab.name}`}
					>
						<X size={12} />
					</button>
				</div>
			{/each}
		</div>
		<p class="ml-3 pb-1 text-xs text-zinc-500 dark:text-zinc-400">tab {tabSize}</p>
	</div>

	<div class="min-h-0 flex-1 overflow-hidden p-2">
		<CodeMirror
			{value}
			onchange={onChange}
			lang={mimoLanguage}
			tabSize={tabSize}
			lineNumbers={true}
			lineWrapping={false}
			editable={true}
			placeholder="Write Mimo code here"
			class="h-full min-h-[22rem] overflow-auto rounded-xl border border-zinc-300 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-950"
			styles={editorStyles}
		/>
	</div>
</section>
