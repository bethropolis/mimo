// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './index.js' // Specify the entry point as index.js
      },
      output: {
        manualChunks: false,
        inlineDynamicImports: true,
        entryFileNames: 'assets/[name].js' // Specify the output file name and directory
      }
    }
  }
})