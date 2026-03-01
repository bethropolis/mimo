// bin/commands/doctor.js
// Validates the Mimo runtime environment, adapter API, and stdlib availability.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { Mimo } from '../../index.js';
import { nodeAdapter } from '../../adapters/nodeAdapter.js';
import { c } from '../utils/colors.js';

const REQUIRED_ADAPTER_METHODS = [
    'readFileSync',
    'writeFileSync',
    'existsSync',
    'dirname',
    'resolvePath',
    'joinPath',
    'basename',
    'extname',
    'getEnvVariable',
    'getEnvAll',
    'fetchSync',
];

const STDLIB_MODULES = [
    'array', 'assert', 'datetime', 'env', 'fs',
    'http', 'json', 'math', 'object', 'path', 'regex', 'string',
];

export function help() {
    console.log(`
${c.bold('mimo doctor')} — Validate the Mimo runtime environment

${c.bold('Usage:')}
  mimo doctor

${c.bold('Checks performed:')}
  - Node adapter API completeness
  - Bun runtime detection
  - Filesystem read/write access in current directory
  - curl availability (required by the http stdlib module)
  - Interpreter smoke test (evaluates \`+ 1 2\`)
  - Stdlib module registry (all built-in modules resolve)
`);
}

export function run(_args) {
    const checks = [];
    const pass = (name, detail) => checks.push({ status: 'PASS', name, detail });
    const warn = (name, detail) => checks.push({ status: 'WARN', name, detail });
    const fail = (name, detail) => checks.push({ status: 'FAIL', name, detail });

    // 1. Adapter API
    const missing = REQUIRED_ADAPTER_METHODS.filter((m) => typeof nodeAdapter[m] !== 'function');
    if (missing.length === 0) {
        pass('Adapter API', 'All required adapter methods are present.');
    } else {
        fail('Adapter API', `Missing: ${missing.join(', ')}. Add them to adapters/nodeAdapter.js.`);
    }

    // 2. Bun runtime
    if (process.versions?.bun) {
        pass('Bun runtime', `Detected Bun ${process.versions.bun}.`);
    } else {
        warn('Bun runtime', 'Bun version could not be detected.');
    }

    // 3. Filesystem access
    try {
        const probe = path.join(process.cwd(), '.mimo_doctor_tmp');
        fs.writeFileSync(probe, 'ok', 'utf-8');
        fs.unlinkSync(probe);
        pass('Filesystem access', 'Read/write operations in current directory work.');
    } catch (err) {
        fail('Filesystem access', `Failed RW check in cwd: ${err.message}`);
    }

    // 4. curl (needed by http stdlib)
    {
        const curl = spawnSync('curl', ['--version'], { encoding: 'utf-8' });
        if (curl.status === 0) {
            pass('HTTP dependency', 'curl is installed (required by http module).');
        } else {
            warn('HTTP dependency', 'curl not found — `http.get/post` will fail until curl is installed.');
        }
    }

    // 5. Interpreter smoke test
    {
        const mimo = new Mimo(nodeAdapter);
        try {
            const result = mimo.run('+ 1 2', '/doctor_smoke.mimo');
            pass('Interpreter smoke test', `Basic evaluation works (result: ${result}).`);
        } catch (err) {
            fail('Interpreter smoke test', String(err));
        }
    }

    // 6. Stdlib module registry
    {
        const mimo = new Mimo(nodeAdapter);
        const unresolved = [];
        for (const mod of STDLIB_MODULES) {
            try {
                mimo.interpreter.moduleLoader.loadModule(mod, process.cwd());
            } catch {
                unresolved.push(mod);
            }
        }
        if (unresolved.length === 0) {
            pass('Stdlib module registry', 'All built-in stdlib modules resolved.');
        } else {
            fail('Stdlib module registry', `Failed to resolve: ${unresolved.join(', ')}.`);
        }
    }

    // ── Report ────────────────────────────────────────────────────────────────

    const statusColor = { PASS: c.green, WARN: c.yellow, FAIL: c.red };

    console.log(`\n${c.bold('Mimo Doctor Report')} ${c.dim(`(${new Date().toISOString()})`)}\n`);
    for (const item of checks) {
        const badge = statusColor[item.status](`[${item.status}]`);
        console.log(`${badge} ${c.bold(item.name)}: ${item.detail}`);
    }

    const hasFail = checks.some((ch) => ch.status === 'FAIL');
    const hasWarn = checks.some((ch) => ch.status === 'WARN');

    if (hasFail) {
        console.log(`\n${c.red(c.bold('Doctor result: FAILED'))}`);
        process.exit(1);
    }
    if (hasWarn) {
        console.log(`\n${c.yellow(c.bold('Doctor result: PASS WITH WARNINGS'))}`);
        return;
    }
    console.log(`\n${c.green(c.bold('Doctor result: PASS'))}`);
}
