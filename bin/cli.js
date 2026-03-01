#!/usr/bin/env bun
// bin/cli.js — Mimo Language Toolkit entry point
// This file is intentionally thin: it parses the top-level command and
// delegates to the appropriate module in bin/commands/.

import { c }          from './utils/colors.js';
import { getVersion } from './utils/version.js';

// ── Command registry ──────────────────────────────────────────────────────────

const COMMANDS = {
    help:    () => import('./commands/help.js'),
    run:     () => import('./commands/run.js'),
    repl:    () => import('./commands/repl.js'),
    fmt:     () => import('./commands/fmt.js'),
    lint:    () => import('./commands/lint.js'),
    test:    () => import('./commands/test.js'),
    convert: () => import('./commands/convert.js'),
    doctor:  () => import('./commands/doctor.js'),
};

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    const args    = process.argv.slice(2);
    const command = args[0];
    const rest    = args.slice(1);

    // No args → global help
    if (!command) {
        const { run } = await import('./commands/help.js');
        await run([]);
        return;
    }

    // Version
    if (command === '--version' || command === '-v') {
        console.log(getVersion());
        return;
    }

    // Help flags → same as `mimo help`
    if (command === '--help' || command === '-h' || command === 'help') {
        const { run } = await import('./commands/help.js');
        await run(rest);
        return;
    }

    // --eval / -e
    if (command === '--eval' || command === '-e') {
        const { run, help } = await import('./commands/eval.js');
        if (rest.includes('--help')) { help(); return; }
        await run(rest);
        return;
    }

    // STDIN shorthand: `mimo -`
    if (command === '-') {
        const { run } = await import('./commands/run.js');
        await run(['-']);
        return;
    }

    // Named commands
    if (command in COMMANDS) {
        const { run, help } = await COMMANDS[command]();
        if (rest.includes('--help')) { help(); return; }
        await run(rest);
        return;
    }

    // Default: treat the argument as a file path
    const { run } = await import('./commands/run.js');
    await run(args);
}

main().catch((err) => {
    console.error(c.error('Unexpected error: ') + (err?.message ?? String(err)));
    process.exit(1);
});
