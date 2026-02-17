<script>
	import CodeMirror from 'svelte-codemirror-editor';
	import X from '@lucide/svelte/icons/x';
	import { mimoEditorExtensions, mimoLanguage } from '$lib/editor/mimo-language.js';
	import { getMimoTheme } from '$lib/editor/mimo-theme.js';

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

	let editorStyles = $derived({
		'&': {
			height: '100%',
			fontSize: `${fontSize}px`
		}
	});
	let editorTheme = $derived(getMimoTheme(resolvedTheme === 'dark' ? 'dark' : 'light'));
	let editorExtensions = $derived([...mimoEditorExtensions, ...editorTheme]);
</script>

<section class="flex h-full flex-col border border-border/40 bg-surface">
	<div class="flex items-center justify-between border-b border-border/50 px-2 pt-2">
		<div class="flex min-w-0 flex-1 gap-0 overflow-auto">
			{#each tabs as tab (tab.id)}
				<div
					class={`group -mb-px inline-flex items-center border-b-2 px-3 py-1.5 text-xs ${
						tab.id === activeTabId
							? 'border-accent bg-surface text-app-fg'
							: 'border-transparent bg-transparent text-text-muted hover:bg-surface-muted'
					}`}
				>
					<button type="button" onclick={() => onSelectTab(tab.id)} class="max-w-[10rem] truncate">{tab.name}</button>
					<button
						type="button"
						onclick={() => onCloseTab(tab.id)}
						class="ml-2 rounded px-1 text-text-soft hover:bg-surface-elevated hover:text-app-fg"
						aria-label={`Close ${tab.name}`}
					>
						<X size={12} />
					</button>
				</div>
			{/each}
		</div>
		<p class="ml-3 pb-1 text-xs text-text-soft">tab {tabSize}</p>
	</div>

	<div class="min-h-0 flex-1 overflow-hidden">
		<CodeMirror
			{value}
			onchange={onChange}
			lang={mimoLanguage}
			tabSize={tabSize}
			lineNumbers={true}
			lineWrapping={false}
			editable={true}
			placeholder="Write Mimo code here"
			extensions={editorExtensions}
			autocompletion={false}
			class="h-full min-h-[22rem] overflow-auto bg-surface"
			styles={editorStyles}
		/>
	</div>
</section>
