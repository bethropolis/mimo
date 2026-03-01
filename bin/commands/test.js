// bin/commands/test.js
// Runs .mimo test files and reports results.

import fs from 'node:fs';
import path from 'node:path';
import { Mimo } from '../../index.js';
import { nodeAdapter } from '../../adapters/nodeAdapter.js';
import { formatError } from '../utils/formatError.js';
import { c } from '../utils/colors.js';

function collectTestFiles(dir, out = []) {
    for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (fs.statSync(full).isDirectory()) {
            collectTestFiles(full, out);
        } else if (
            entry.endsWith('.mimo') &&
            (entry.includes('.test.') || dir.includes('test'))
        ) {
            out.push(full);
        }
    }
    return out;
}

export function help() {
    console.log(`
${c.bold('mimo test')} — Run Mimo test files

${c.bold('Usage:')}
  mimo test [path]

${c.bold('Options:')}
  --verbose      Show captured output even for passing tests
  --quiet        Only print the final summary line

${c.bold('Arguments:')}
  path           File or directory to test. Defaults to current directory.
                 Discovers all .mimo files inside directories named 'test'
                 or files with '.test.' in their name.

${c.bold('Examples:')}
  mimo test
  mimo test test/source/
  mimo test test/source/strings.mimo
`);
}

export async function run(args) {
    const verbose = args.includes('--verbose');
    const quiet   = args.includes('--quiet');
    const targets = args.filter((a) => !a.startsWith('--'));
    const target  = targets[0] ?? '.';

    const absoluteTarget = path.resolve(process.cwd(), target);
    let filesToTest = [];

    if (!fs.existsSync(absoluteTarget)) {
        console.error(c.error(`Error: Path not found: ${target}`));
        process.exit(1);
    }

    if (fs.statSync(absoluteTarget).isFile()) {
        filesToTest.push(absoluteTarget);
    } else {
        filesToTest = collectTestFiles(absoluteTarget);
    }

    if (filesToTest.length === 0) {
        console.log(c.yellow('No test files found.'));
        return;
    }

    if (!quiet) console.log(`\n${c.bold('Mimo Test Runner')}\n`);

    let passed = 0;
    let failed = 0;
    const t0   = Date.now();

    for (const file of filesToTest) {
        const relName = path.relative(process.cwd(), file);
        if (!quiet) process.stdout.write(`  ${c.dim(relName)} ... `);

        const source = fs.readFileSync(file, 'utf-8');
        const logs   = [];

        const testAdapter = {
            ...nodeAdapter,
            log:   (...a) => logs.push(a.join(' ')),
            error: (...a) => logs.push(c.dim('[stderr] ') + a.join(' ')),
        };

        const mimo = new Mimo(testAdapter);

        try {
            mimo.run(source, file);
            if (!quiet) console.log(c.green('PASS'));
            passed++;
            if (verbose && logs.length > 0) {
                console.log(c.dim('  --- output ---'));
                for (const l of logs) console.log('  ' + l);
            }
        } catch (err) {
            if (!quiet) console.log(c.red('FAIL'));
            failed++;
            if (!quiet) {
                if (logs.length > 0) {
                    console.log(c.dim('  --- output ---'));
                    for (const l of logs) console.log('  ' + l);
                }
                console.log(c.dim('  --- error ---'));
                console.log('  ' + formatError(err, source).replace(/\n/g, '\n  '));
                console.log();
            }
        }
    }

    const ms      = ((Date.now() - t0) / 1000).toFixed(2);
    const summary = failed > 0
        ? `${c.green(`${passed} passed`)}, ${c.red(`${failed} failed`)}`
        : c.green(`${passed} passed`);

    console.log(`\nTest Result: ${summary}. ${c.dim(`(Time: ${ms}s)`)}`);

    if (failed > 0) process.exit(1);
}
