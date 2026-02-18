import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// Catppuccin color palette for syntax highlighting
const latte = {
	dark: false,
	text: '#4c4f69',
	subtext0: '#6c6f85',
	surface0: '#ccd0da',
	surface1: '#bcc0cc',
	surface2: '#acb0be',
	base: '#eff1f5',
	mantle: '#e6e9ef',
	blue: '#1e66f5',
	teal: '#179299',
	sky: '#04a5e5',
	mauve: '#8839ef',
	peach: '#fe640b',
	yellow: '#df8e1d',
	green: '#40a02b',
	red: '#d20f39',
	pink: '#ea76cb',
	lavender: '#7287fd',
	overlay2: '#7c7f93',
	rosewater: '#dc8a78'
};

const mocha = {
	dark: true,
	text: '#cdd6f4',
	subtext0: '#a6adc8',
	surface0: '#313244',
	surface1: '#45475a',
	surface2: '#585b70',
	base: '#1e1e2e',
	mantle: '#181825',
	blue: '#89b4fa',
	teal: '#94e2d5',
	sky: '#89dceb',
	mauve: '#cba6f7',
	peach: '#fab387',
	yellow: '#f9e2af',
	green: '#a6e3a1',
	red: '#f38ba8',
	pink: '#f5c2e7',
	lavender: '#b4befe',
	overlay2: '#9399b2',
	rosewater: '#f5e0dc'
};

/**
 * Create a CodeMirror theme using CSS variables for UI elements
 * and Catppuccin colors for syntax highlighting
 * @param {{ dark: boolean }} options
 */
function createTheme({ dark }) {
	const theme = EditorView.theme(
		{
			'&': {
				color: 'var(--cm-fg)',
				backgroundColor: 'var(--cm-bg)'
			},
			'.cm-content': {
				caretColor: 'var(--cm-caret)'
			},
			'.cm-cursor, .cm-dropCursor': {
				borderLeftColor: 'var(--cm-caret)'
			},
			'&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
				{
					backgroundColor: 'var(--cm-selection)'
				},
			'.cm-activeLine': {
				backgroundColor: 'var(--cm-active-line)'
			},
			'.cm-selectionMatch': {
				backgroundColor: 'color-mix(in oklab, var(--cm-selection) 50%, transparent)'
			},
			'.cm-gutters': {
				backgroundColor: 'var(--cm-gutter-bg)',
				color: 'var(--cm-gutter-fg)',
				borderRight: '1px solid var(--cm-gutter-border)'
			},
			'.cm-activeLineGutter': {
				backgroundColor: 'var(--cm-active-gutter-bg)',
				color: 'var(--cm-active-gutter-fg)'
			},
			'.cm-foldPlaceholder': {
				backgroundColor: 'transparent',
				border: 'none',
				color: 'var(--text-soft)'
			},
			'.cm-tooltip': {
				border: '1px solid var(--border)',
				backgroundColor: 'var(--surface)',
				color: 'var(--app-fg)'
			},
			'.cm-tooltip .cm-tooltip-arrow:before': {
				borderTopColor: 'transparent',
				borderBottomColor: 'transparent'
			},
			'.cm-tooltip .cm-tooltip-arrow:after': {
				borderTopColor: 'var(--surface)',
				borderBottomColor: 'var(--surface)'
			},
			'.cm-tooltip-autocomplete > ul > li[aria-selected]': {
				backgroundColor: 'var(--surface-elevated)',
				color: 'var(--app-fg)'
			},
			'.cm-panels': {
				backgroundColor: 'var(--surface-muted)',
				color: 'var(--app-fg)'
			},
			'.cm-search': {
				backgroundColor: 'var(--surface)',
				border: '1px solid var(--border)'
			}
		},
		{ dark }
	);

	// Use Catppuccin colors for syntax highlighting
	const colors = dark ? mocha : latte;

	const highlight = HighlightStyle.define([
		{ tag: t.keyword, color: colors.mauve },
		{ tag: [t.function(t.variableName), t.function(t.propertyName), t.propertyName, t.labelName], color: colors.blue },
		{ tag: [t.typeName, t.className, t.annotation, t.namespace], color: colors.yellow },
		{ tag: [t.operator], color: colors.sky },
		{ tag: [t.bool, t.atom], color: colors.red },
		{ tag: [t.number], color: colors.peach },
		{ tag: [t.string], color: colors.green },
		{ tag: [t.comment], color: colors.overlay2, fontStyle: 'italic' },
		{ tag: [t.special(t.variableName)], color: colors.lavender },
		{ tag: [t.variableName], color: colors.text },
		{ tag: [t.punctuation], color: colors.overlay2 },
		{ tag: [t.invalid], color: colors.red }
	]);

	return [theme, syntaxHighlighting(highlight)];
}

// Pre-create themes for light and dark modes
export const mimoLightTheme = createTheme({ dark: false });
export const mimoDarkTheme = createTheme({ dark: true });

/**
 * Get the appropriate theme based on mode
 * @param {'light'|'dark'} mode
 */
export function getMimoTheme(mode) {
	return mode === 'dark' ? mimoDarkTheme : mimoLightTheme;
}
