#!/usr/bin/env bun
// tools/stamp-version.js
// Reads the version from package.json and writes it as a static literal into
// bin/utils/version.js so that `bun build --compile` bakes the correct string
// into the standalone binary.
//
// Run automatically via the `prebuild:mimo` script, or manually:
//   bun tools/stamp-version.js

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dir, '..');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
const version = pkg.version;

const target = path.join(root, 'bin', 'utils', 'version.js');
const content = `// bin/utils/version.js
// This string is stamped by the \`prebuild:mimo\` script (tools/stamp-version.js).
// It is a static literal so it survives \`bun build --compile\` and global installs.
export const VERSION = '${version}';

export function getVersion() {
    return VERSION;
}
`;

fs.writeFileSync(target, content, 'utf-8');
console.log(`Stamped version ${version} into bin/utils/version.js`);
