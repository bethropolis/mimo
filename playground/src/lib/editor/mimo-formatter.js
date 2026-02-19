import { keymap } from '@codemirror/view';
import { EditorView } from '@codemirror/view';

/**
 * Create a CodeMirror keybinding for formatting Mimo code
 * @param {() => void} formatCallback - Function to call when format is triggered
 * @returns {import('@codemirror/state').Extension}
 */
export function mimoFormatKeymap(formatCallback) {
	return keymap.of([
		{
			key: 'Mod-Shift-f',
			run: (view) => {
				formatCallback();
				return true;
			}
		},
		{
			key: 'Alt-Shift-f',
			run: (view) => {
				formatCallback();
				return true;
			}
		}
	]);
}
