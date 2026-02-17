import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';

const darkSyntax = HighlightStyle.define([
	{ tag: tags.comment, color: '#71717a', fontStyle: 'italic' },
	{ tag: tags.string, color: '#4ade80' }, // Green-400
	{ tag: tags.number, color: '#fbbf24' }, // Amber-400
	{ tag: tags.bool, color: '#fb7185', fontWeight: 'bold' }, // Rose-400
	{ tag: tags.keyword, color: '#818cf8', fontWeight: 'bold' }, // Indigo-400
	{ tag: tags.operator, color: '#f472b6' }, // Pink-400
	{ tag: [tags.typeName, tags.className], color: '#c084fc' }, // Purple-400
	{ tag: tags.macroName, color: '#2dd4bf' }, // Teal-400
	{ tag: tags.punctuation, color: '#a1a1aa' }, // Zinc-400
	{ tag: tags.variableName, color: '#f4f4f5' } // Zinc-100
]);

const lightSyntax = HighlightStyle.define([
	{ tag: tags.comment, color: '#71717a', fontStyle: 'italic' },
	{ tag: tags.string, color: '#16a34a' }, // Green-600
	{ tag: tags.number, color: '#d97706' }, // Amber-600
	{ tag: tags.bool, color: '#e11d48', fontWeight: 'bold' }, // Rose-600
	{ tag: tags.keyword, color: '#4f46e5', fontWeight: 'bold' }, // Indigo-600
	{ tag: tags.operator, color: '#db2777' }, // Pink-600
	{ tag: [tags.typeName, tags.className], color: '#9333ea' }, // Purple-600
	{ tag: tags.macroName, color: '#0d9488' }, // Teal-600
	{ tag: tags.punctuation, color: '#52525b' }, // Zinc-600
	{ tag: tags.variableName, color: '#18181b' } // Zinc-900
]);

const darkUi = EditorView.theme(
	{
		'&': {
			backgroundColor: '#09090b', // Zinc-950
			color: '#f4f4f5'
		},
		'.cm-content': {
			caretColor: '#f4f4f5',
			padding: '10px 0'
		},
		'.cm-cursor, .cm-dropCursor': {
			borderLeftColor: '#f4f4f5'
		},
		'.cm-activeLine': {
			backgroundColor: '#18181b' // Zinc-900
		},
		'.cm-selectionBackground, .cm-content ::selection': {
			backgroundColor: '#3f3f46' // Zinc-700
		},
		'.cm-gutters': {
			backgroundColor: '#09090b',
			color: '#52525b', // Zinc-600
			borderRight: 'none',
			padding: '0 8px'
		},
		'.cm-activeLineGutter': {
			backgroundColor: '#18181b',
			color: '#a1a1aa' // Zinc-400
		}
	},
	{ dark: true }
);

const lightUi = EditorView.theme({
	'&': {
		backgroundColor: '#ffffff',
		color: '#18181b'
	},
	'.cm-content': {
		caretColor: '#18181b',
		padding: '10px 0'
	},
	'.cm-cursor, .cm-dropCursor': {
		borderLeftColor: '#18181b'
	},
	'.cm-activeLine': {
		backgroundColor: '#f4f4f5' // Zinc-100
	},
	'.cm-selectionBackground, .cm-content ::selection': {
		backgroundColor: '#e4e4e7' // Zinc-200
	},
	'.cm-gutters': {
		backgroundColor: '#ffffff',
		color: '#a1a1aa', // Zinc-400
		borderRight: 'none',
		padding: '0 8px'
	},
	'.cm-activeLineGutter': {
		backgroundColor: '#f4f4f5',
		color: '#52525b' // Zinc-600
	}
});

/** @param {boolean} isDark */
export function mimoEditorTheme(isDark) {
	return [isDark ? darkUi : lightUi, syntaxHighlighting(isDark ? darkSyntax : lightSyntax)];
}
