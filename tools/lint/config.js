/**
 * tools/lint/config.js
 *
 * Loads per-project lint configuration from a `.mimorc` file.
 *
 * File format (JSON):
 * {
 *   "rules": {
 *     "no-unused-vars": true,
 *     "prefer-const": false,
 *     "no-magic-numbers": { "severity": "error", "allow": [0, 1, 2] },
 *     "max-depth": { "max": 4 }
 *   }
 * }
 *
 * The resolved config is merged in this priority order (highest wins):
 *   CLI --rule flags  >  .mimorc  >  DEFAULT_RULES in linter.js
 *
 * loadConfig() is designed to be safe in non-Node environments (bundlers,
 * playground): it accepts an optional `readFileFn` so callers can inject
 * a filesystem reader.  When no reader is provided it returns an empty
 * config object (no file system access attempted).
 */

/**
 * Attempt to load and parse a `.mimorc` file located at `configPath`.
 *
 * @param {string} configPath - Absolute path to the `.mimorc` file.
 * @param {Function|null} readFileFn - A sync `(path) => string` reader,
 *   e.g. `(p) => fs.readFileSync(p, 'utf-8')`.  Pass `null` or omit to
 *   skip file I/O (safe for bundled/browser environments).
 * @returns {{ rules: Object }} Parsed config, or `{ rules: {} }` on any
 *   failure (missing file, bad JSON, wrong environment).
 */
export function loadConfig(configPath, readFileFn = null) {
    if (typeof readFileFn !== 'function') {
        return { rules: {} };
    }

    let raw;
    try {
        raw = readFileFn(configPath);
    } catch {
        // File does not exist or is unreadable — silently return empty config
        return { rules: {} };
    }

    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch (e) {
        throw new Error(`.mimorc: invalid JSON — ${e.message}`);
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('.mimorc: root must be a JSON object');
    }

    const rules = parsed.rules;
    if (rules !== undefined && (typeof rules !== 'object' || Array.isArray(rules))) {
        throw new Error('.mimorc: "rules" must be an object');
    }

    return { rules: rules || {} };
}

/**
 * Merge rule configs in priority order.
 * Later arguments take precedence over earlier ones.
 *
 * Each argument is a `{ ruleId: true | false | {...options} }` map.
 *
 * @param {...Object} layers
 * @returns {Object}
 */
export function mergeRuleConfigs(...layers) {
    const result = {};
    for (const layer of layers) {
        if (!layer || typeof layer !== 'object') continue;
        for (const [ruleId, value] of Object.entries(layer)) {
            result[ruleId] = value;
        }
    }
    return result;
}

/**
 * Find the `.mimorc` file by walking up from `startDir` to `rootDir`.
 * Returns the path of the first `.mimorc` found, or `null`.
 *
 * @param {string} startDir
 * @param {string} rootDir
 * @param {Function} readFileFn - Same sync reader as in loadConfig().
 * @param {Function} pathJoinFn - `(a, b) => string` path joiner.
 * @returns {string|null}
 */
export function findConfigFile(startDir, rootDir, readFileFn, pathJoinFn) {
    if (typeof readFileFn !== 'function' || typeof pathJoinFn !== 'function') return null;

    let dir = startDir;
    while (true) {
        const candidate = pathJoinFn(dir, '.mimorc');
        try {
            readFileFn(candidate);
            return candidate; // readable → found
        } catch {
            // not here
        }
        const parent = pathJoinFn(dir, '..');
        if (parent === dir || dir === rootDir) break;
        dir = parent;
    }
    return null;
}
