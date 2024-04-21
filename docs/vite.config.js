import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			injectRegister: 'auto',
			registerType: 'autoUpdate',
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg}']
			},
			manifest: {
				name: 'mimo playground',
				short_name: 'mimo',
				description: 'a simple programming language written in javascript.',
				theme_color: '#1D232A',
				icons: [
					{
						src: 'web/icon-192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'web/icon-192-maskable.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'maskable'
					},
					{
						src: 'web/icon-512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: 'web/icon-512-maskable.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			}
		})
	],
	optimizeDeps: {
		exclude: ['js-big-decimal']
	  },
	build: {
		target: 'esnext'
	}
});
