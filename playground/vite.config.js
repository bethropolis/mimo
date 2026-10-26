import adapter from '@sveltejs/adapter-static';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			alias: { '$lib': 'src/lib' },
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				precompress: false
			})
		})
	],
	resolve: {
		dedupe: [
			'codemirror',
			'@codemirror/state',
			'@codemirror/view',
			'@codemirror/language',
			'@lezer/highlight',
			'@lezer/common',
			'@lezer/lr'
		]
	},
	optimizeDeps: {
		exclude: [
			'codemirror',
			'@codemirror/state',
			'@codemirror/view',
			'@codemirror/language',
			'@codemirror/autocomplete',
			'@codemirror/commands',
			'@codemirror/lint',
			'@codemirror/search',
			'@lezer/highlight',
			'@lezer/common',
			'@lezer/lr'
		]
	}
});
