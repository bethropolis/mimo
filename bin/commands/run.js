// bin/commands/run.js
// Executes a .mimo file (or STDIN) through the Mimo interpreter.

import fs from 'node:fs';
import path from 'node:path';
import { Mimo } from '../../index.js';
import { nodeAdapter } from '../../adapters/nodeAdapter.js';
import { formatError } from '../utils/formatError.js';
import { readStdin } from '../utils/fs.js';
import { c } from '../utils/colors.js';

export function help() {
    console.log(`
${c.bold('mimo run')} — Execute a Mimo file

${c.bold('Usage:')}
  mimo run <file>
  mimo <file>
  mimo -                     Read from STDIN
  echo "code" | mimo

${c.bold('Examples:')}
  mimo hello.mimo
  mimo run examples/hello.mimo
  echo 'show + 1 2' | mimo
`);
}

export async function run(args) {
    // args[0] is either the file path or already stripped by cli.js
    const filePath = args[0];

    // No file given → try STDIN
    if (!filePath || filePath === '-') {
        if (process.stdin.isTTY && filePath !== '-') {
            console.error(c.error('Error: No file specified. Use `mimo --help` for usage.'));
            process.exit(1);
        }
        const source = await readStdin();
        const mimo = new Mimo(nodeAdapter);
        try {
            mimo.run(source, '/stdin');
        } catch (err) {
            console.error(formatError(err, source));
            process.exit(1);
        }
        return;
    }

    const absolutePath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
        console.error(c.error(`Error: File not found: ${absolutePath}`));
        process.exit(1);
    }

    const source = fs.readFileSync(absolutePath, 'utf-8');
    const mimo = new Mimo(nodeAdapter);
    try {
        mimo.run(source, absolutePath);
    } catch (err) {
        console.error(formatError(err, source));
        process.exit(1);
    }
}
