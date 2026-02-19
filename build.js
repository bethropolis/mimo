import * as esbuild from 'esbuild';
import fs from 'node:fs';

console.log("Bundling Mimo for the web...");

// Create the 'dist' directory if it doesn't exist
if (!fs.existsSync('./dist')) {
    fs.mkdirSync('./dist');
}

esbuild.build({
    entryPoints: ['web/index.js'],
    bundle: true,
    outfile: 'dist/mimo.web.js',
    format: 'iife', 
    globalName: 'mimoBundle',
    minify: true,
}).catch(() => process.exit(1));