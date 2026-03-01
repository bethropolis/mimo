// bin/commands/fmt.js
// Formats .mimo files using the Mimo pretty-printer.

import { formatFile, formatSource } from '../../tools/formatter.js';
import { collectMimoFiles, readStdin } from '../utils/fs.js';
import { c } from '../utils/colors.js';

export function help() {
    console.log(`
${c.bold('mimo fmt')} — Format Mimo source files

${c.bold('Usage:')}
  mimo fmt [options] [paths...]
  echo "code" | mimo fmt

${c.bold('Options:')}
  --write          Write formatted output back to files (default: preview)
  --check          Exit with code 1 if any file is not formatted (CI mode)
  --quiet          Suppress all output except errors
  --verbose        Show each file's status even when unchanged

${c.bold('Examples:')}
  mimo fmt src/                       Preview formatting for all files in src/
  mimo fmt --write src/               Format files in place
  mimo fmt --check src/               CI check (non-zero exit if unformatted)
  echo 'show + 1 2' | mimo fmt        Format from STDIN
`);
}

export async function run(args) {
    const shouldWrite   = args.includes('--write');
    const shouldCheck   = args.includes('--check');
    const quiet         = args.includes('--quiet');
    const verbose       = args.includes('--verbose');
    const targets       = args.filter((a) => !a.startsWith('--'));

    // STDIN mode
    if (targets.includes('-') || (targets.length === 0 && !process.stdin.isTTY)) {
        const source = await readStdin();
        try {
            process.stdout.write(formatSource(source, 'stdin'));
        } catch (err) {
            console.error(c.error(err.message ?? String(err)));
            process.exit(1);
        }
        return;
    }

    const files = collectMimoFiles(targets);
    if (files.length === 0) {
        console.error(c.error('Error: No .mimo files found for formatting.'));
        process.exit(1);
    }

    const t0 = Date.now();
    let hadErrors      = false;
    let hadUnformatted = false;
    let changedCount   = 0;

    for (const file of files) {
        const result = formatFile(file, { write: shouldWrite, check: shouldCheck, quiet: true });
        if (!result.ok) {
            hadErrors = true;
            // formatFile already printed its own error; nothing extra needed
            continue;
        }

        if (shouldCheck) {
            if (result.changed) {
                hadUnformatted = true;
                if (!quiet) console.log(`${c.red('✗')} ${file}`);
            } else if (verbose) {
                console.log(`${c.green('✓')} ${file}`);
            }
        } else if (shouldWrite) {
            if (result.changed) {
                changedCount++;
                if (!quiet) console.log(`${c.green('formatted')} ${file}`);
            } else if (verbose) {
                console.log(`${c.dim('unchanged')} ${file}`);
            }
        } else {
            // Preview mode — print formatted output (formatFile already did it in non-quiet mode)
            // Re-invoke in non-quiet for preview only when verbose or single file
            if (!quiet) {
                formatFile(file, { write: false, check: false, quiet: false });
            }
        }
    }

    const ms = Date.now() - t0;

    if (!quiet && !shouldCheck && shouldWrite) {
        const summary = changedCount > 0
            ? c.green(`${changedCount} file${changedCount !== 1 ? 's' : ''} formatted`)
            : c.dim('All files already formatted');
        console.log(`\n${summary} ${c.dim(`(${ms}ms)`)}`);
    }

    if (!quiet && shouldCheck) {
        if (hadUnformatted) {
            console.log(c.red(`\nSome files are not formatted. Run \`mimo fmt --write\` to fix.`));
        } else {
            console.log(c.green(`\nAll files are properly formatted. ${c.dim(`(${ms}ms)`)}`));
        }
    }

    if (hadErrors || hadUnformatted) process.exit(1);
}
