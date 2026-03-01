// bin/commands/lint.js
// Statically analyses .mimo files using the Mimo linter.

import { lintFile, lintFileJson, parseRuleFlags } from '../../tools/linter.js';
import { collectMimoFiles } from '../utils/fs.js';
import { c } from '../utils/colors.js';

export function help() {
    console.log(`
${c.bold('mimo lint')} — Statically analyse Mimo source files

${c.bold('Usage:')}
  mimo lint [options] [paths...]

${c.bold('Options:')}
  --fail-on-warning    Exit 1 on warnings (not just errors)
  --quiet              Suppress per-file output; print only summary
  --verbose            Show rule IDs alongside messages
  --json               Output results as JSON (for tooling)
  --rule:<name>=<bool> Override a specific rule (e.g. --rule:no-magic-numbers=true)

${c.bold('Available rules:')}
  no-unused-vars       (on by default)
  prefer-const         (on by default)
  no-magic-numbers
  no-empty-function
  max-depth
  no-shadow
  consistent-return

${c.bold('Examples:')}
  mimo lint src/
  mimo lint --fail-on-warning src/
  mimo lint --rule:no-magic-numbers=true src/
  mimo lint --json src/ | jq .
`);
}

export async function run(args) {
    const quiet         = args.includes('--quiet');
    const verbose       = args.includes('--verbose');
    const json          = args.includes('--json');
    const failOnWarning = args.includes('--fail-on-warning');
    const rules         = parseRuleFlags(args);
    const targets       = args.filter((a) => !a.startsWith('--'));
    const files         = collectMimoFiles(targets);

    if (files.length === 0) {
        console.error(c.error('Error: No .mimo files found for linting.'));
        process.exit(1);
    }

    const t0 = Date.now();

    if (json) {
        const results = files.map((f) => lintFileJson(f, { rules }));
        console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
        const hasParseErrors = results.some((r) => !r.ok);
        const errorCount     = results.reduce((s, r) => s + r.messages.filter((m) => m.severity === 'error').length, 0);
        const warningCount   = results.reduce((s, r) => s + r.messages.filter((m) => m.severity !== 'error').length, 0);
        if (hasParseErrors || errorCount > 0 || (failOnWarning && warningCount > 0)) process.exit(1);
        return;
    }

    let hasParseErrors = false;
    let totalErrors    = 0;
    let totalWarnings  = 0;
    let fileCount      = 0;

    for (const file of files) {
        const result = lintFile(file, { quiet: true, rules, verbose });
        if (!result.ok) {
            hasParseErrors = true;
            if (!quiet) console.error(`${c.red('parse error')} ${file}`);
            continue;
        }

        fileCount++;
        const errors   = result.messages.filter((m) => m.severity === 'error');
        const warnings = result.messages.filter((m) => m.severity !== 'error');
        totalErrors   += errors.length;
        totalWarnings += warnings.length;

        if (quiet) continue;

        const hasIssues = errors.length > 0 || warnings.length > 0;
        if (!hasIssues) {
            if (verbose) console.log(`${c.green('✓')} ${file}`);
            continue;
        }

        console.log(`\n${c.bold(file)}`);
        for (const msg of result.messages) {
            const loc      = msg.line ? `${c.dim(`${msg.line}:${msg.column ?? 1}`)}` : '';
            const badge    = msg.severity === 'error'
                ? c.red('error')
                : c.yellow('warn ');
            const ruleTag  = verbose ? c.dim(` [${msg.ruleId ?? 'unknown'}]`) : '';
            console.log(`  ${badge} ${loc.padEnd(8)} ${msg.message}${ruleTag}`);
        }
    }

    const ms = Date.now() - t0;
    const errorLabel   = totalErrors   > 0 ? c.red(`${totalErrors} error${totalErrors   !== 1 ? 's' : ''}`)   : null;
    const warningLabel = totalWarnings > 0 ? c.yellow(`${totalWarnings} warning${totalWarnings !== 1 ? 's' : ''}`) : null;
    const parts        = [errorLabel, warningLabel].filter(Boolean);

    if (!quiet) {
        if (parts.length > 0) {
            console.log(`\n${parts.join(c.dim(', '))} ${c.dim(`in ${fileCount} file${fileCount !== 1 ? 's' : ''} (${ms}ms)`)}`);
        } else if (!hasParseErrors) {
            console.log(c.green(`\nNo issues found`) + c.dim(` in ${fileCount} file${fileCount !== 1 ? 's' : ''} (${ms}ms)`));
        }
    }

    if (hasParseErrors || totalErrors > 0 || (failOnWarning && totalWarnings > 0)) process.exit(1);
}
