// bin/utils/fs.js
import fs from 'node:fs';
import path from 'node:path';

/**
 * Recursively collect all .mimo files from a list of file/directory targets.
 * Deduplicates by absolute path. Warns on missing paths.
 * @param {string[]} targets
 * @returns {string[]} Absolute paths to .mimo files, in discovery order
 */
export function collectMimoFiles(targets) {
    const resolvedTargets = targets.length === 0 ? ['.'] : targets;
    const seen = new Set();
    const files = [];

    function visit(targetPath) {
        const absolutePath = path.resolve(process.cwd(), targetPath);
        if (!fs.existsSync(absolutePath)) {
            console.error(`Warning: Path not found: ${targetPath}`);
            return;
        }

        const stat = fs.statSync(absolutePath);
        if (stat.isDirectory()) {
            for (const entry of fs.readdirSync(absolutePath)) {
                visit(path.join(absolutePath, entry));
            }
            return;
        }

        if (!absolutePath.endsWith('.mimo')) return;

        if (!seen.has(absolutePath)) {
            seen.add(absolutePath);
            files.push(absolutePath);
        }
    }

    for (const target of resolvedTargets) {
        visit(target);
    }

    return files;
}

/**
 * Read all of STDIN as a UTF-8 string.
 * @returns {Promise<string>}
 */
export function readStdin() {
    return new Promise((resolve) => {
        let data = '';
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', (chunk) => { data += chunk; });
        process.stdin.on('end', () => { resolve(data); });
    });
}
