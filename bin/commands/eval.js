// bin/commands/eval.js
// Evaluates a string of Mimo code passed directly on the command line.

import { Mimo } from '../../index.js';
import { nodeAdapter } from '../../adapters/nodeAdapter.js';
import { formatError } from '../utils/formatError.js';
import { c } from '../utils/colors.js';

export function help() {
    console.log(`
${c.bold('mimo --eval')} — Evaluate a string of Mimo code

${c.bold('Usage:')}
  mimo --eval <code>
  mimo -e <code>

${c.bold('Examples:')}
  mimo -e "show + 1 2"
  mimo -e 'set x 10 \\n show * x 2'
`);
}

export async function run(args) {
    const code = args[0];
    if (!code) {
        console.error(c.error('Error: No code provided to --eval.'));
        process.exit(1);
    }
    const mimo = new Mimo(nodeAdapter);
    try {
        const result = mimo.run(code, '/eval');
        if (result !== undefined && result !== null) {
            console.log(result);
        }
    } catch (err) {
        console.error(formatError(err, code));
        process.exit(1);
    }
}
