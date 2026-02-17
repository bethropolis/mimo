import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

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

/** @param {typeof latte | typeof mocha} colors */
function createTheme(colors) {
	const theme = EditorView.theme(
		{
			'&': {
				color: colors.text,
				backgroundColor: colors.base
			},
			'.cm-content': {
				caretColor: colors.rosewater
			},
			'.cm-cursor, .cm-dropCursor': {
				borderLeftColor: colors.rosewater
			},
			'&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
				{
					backgroundColor: `${colors.surface2}66`
				},
			'.cm-activeLine': {
				backgroundColor: `${colors.surface0}99`
			},
			'.cm-selectionMatch': {
				backgroundColor: `${colors.surface2}4d`
			},
			'.cm-gutters': {
				backgroundColor: colors.base,
				color: colors.subtext0,
				borderRight: `1px solid ${colors.surface1}`
			},
			'.cm-activeLineGutter': {
				backgroundColor: colors.surface0,
				color: colors.text
			},
			'.cm-foldPlaceholder': {
				backgroundColor: 'transparent',
				border: 'none',
				color: colors.overlay2
			},
			'.cm-tooltip': {
				border: `1px solid ${colors.surface2}`,
				backgroundColor: colors.mantle,
				color: colors.text
			},
			'.cm-tooltip .cm-tooltip-arrow:before': {
				borderTopColor: 'transparent',
				borderBottomColor: 'transparent'
			},
			'.cm-tooltip .cm-tooltip-arrow:after': {
				borderTopColor: colors.mantle,
				borderBottomColor: colors.mantle
			},
			'.cm-tooltip-autocomplete > ul > li[aria-selected]': {
				backgroundColor: colors.surface1,
				color: colors.text
			},
			'.cm-panels': {
				backgroundColor: colors.mantle,
				color: colors.text
			}
		},
		{ dark: colors.dark }
	);

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

export const mimoLightTheme = createTheme(latte);
export const mimoDarkTheme = createTheme(mocha);

/** @param {'light'|'dark'} mode */
export function getMimoTheme(mode) {
	return mode === 'dark' ? mimoDarkTheme : mimoLightTheme;
}
