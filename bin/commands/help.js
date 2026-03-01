// bin/commands/help.js
// Shows global help, or per-command help when a command name is provided.

import { c }          from '../utils/colors.js';
import { getVersion } from '../utils/version.js';

// Lazy loaders for each command — mirrors cli.js COMMANDS registry.
const COMMAND_LOADERS = {
    run:     () => import('./run.js'),
    repl:    () => import('./repl.js'),
    fmt:     () => import('./fmt.js'),
    lint:    () => import('./lint.js'),
    test:    () => import('./test.js'),
    convert: () => import('./convert.js'),
    doctor:  () => import('./doctor.js'),
    eval:    () => import('./eval.js'),
};

export function help() {
    // `mimo help --help` is a no-op — just show global help
    run([]);
}

export async function run(args) {
    const target = args[0];

    // `mimo help <command>` → delegate to that command's help()
    if (target && target in COMMAND_LOADERS) {
        const mod = await COMMAND_LOADERS[target]();
        mod.help();
        return;
    }

    // Unknown sub-command
    if (target) {
        console.error(c.error(`Unknown command: ${target}`));
        console.error(c.dim(`Run ${c.cyan('mimo help')} to see all commands.`));
        process.exit(1);
    }

    // Global help
    console.log(`
${c.bold('Mimo Language Toolkit')} ${c.dim(`v${getVersion()}`)}

${c.bold('Usage:')}
  mimo <command> [options]
  mimo <file>

${c.bold('Commands:')}
  ${c.cyan('run')} <file>        Execute a Mimo file (also: mimo <file>)
  ${c.cyan('repl')}              Start the interactive Read-Eval-Print Loop
  ${c.cyan('fmt')} [paths...]    Format .mimo files
                   ${c.dim('--write  --check  --quiet  --verbose')}
  ${c.cyan('lint')} [paths...]   Statically analyse .mimo files
                   ${c.dim('--fail-on-warning  --quiet  --verbose  --json')}
  ${c.cyan('test')} [path]       Run test files
                   ${c.dim('--quiet  --verbose')}
  ${c.cyan('convert')}           Transpile Mimo to another language
                   ${c.dim('--in  --out  --to')}
  ${c.cyan('doctor')}            Validate runtime/tooling environment

${c.bold('Global options:')}
  ${c.cyan('--version')}, ${c.cyan('-v')}      Show version
  ${c.cyan('--help')}, ${c.cyan('-h')}         Show this help
  ${c.cyan('--eval')}, ${c.cyan('-e')} <code>  Evaluate a string of Mimo code
  ${c.cyan('-')}                  Read and execute Mimo code from STDIN

${c.bold('Per-command help:')}
  mimo help <command>
  mimo <command> --help
`);
}
