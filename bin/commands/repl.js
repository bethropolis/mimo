// bin/commands/repl.js
// Starts the interactive Mimo REPL.

import { runRepl } from '../../repl.js';
import { c } from '../utils/colors.js';

export function help() {
    console.log(`
${c.bold('mimo repl')} — Start the interactive Read-Eval-Print Loop

${c.bold('Usage:')}
  mimo repl

${c.bold('REPL shortcuts:')}
  .help        Show REPL help
  .exit        Exit the REPL
  Ctrl+C       Abort current input
  Ctrl+D       Exit
`);
}

export async function run(_args) {
    runRepl();
}
