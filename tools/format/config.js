/**
 * tools/format/config.js
 *
 * Loads and merges formatter options from .mimorc or a caller-supplied object.
 * Uses an injected readFileFn so this module is safe in bundled/browser environments.
 *
 * .mimorc format (JSON):
 *   {
 *     "format": {
 *       "indentSize": 4,
 *       "useTabs": false,
 *       "quoteStyle": "double",
 *       "maxInlineArrayLength": 100,
 *       "maxInlineObjectLength": 80
 *     }
 *   }
 */

export const DEFAULT_FORMAT_OPTIONS = {
    indentSize: 4,
    useTabs: false,
    quoteStyle: 'double',       // 'double' | 'single'
    maxInlineArrayLength: 100,
    maxInlineObjectLength: 80,
};

/**
 * Find the nearest .mimorc file by walking up from startDir.
 * @param {string} startDir   Absolute directory path to start searching from.
 * @param {Function} existsFn (path: string) => boolean
 * @param {Function} joinFn   path.join equivalent
 * @param {Function} dirnameFn path.dirname equivalent
 * @returns {string|null} Absolute path to .mimorc, or null if not found.
 */
export function findConfigFile(startDir, existsFn, joinFn, dirnameFn) {
    let dir = startDir;
    while (true) {
        const candidate = joinFn(dir, '.mimorc');
        if (existsFn(candidate)) return candidate;
        const parent = dirnameFn(dir);
        if (parent === dir) return null; // filesystem root
        dir = parent;
    }
}

/**
 * Load and parse a .mimorc file, returning only the `format` section.
 * @param {string} configPath  Absolute path to .mimorc.
 * @param {Function} readFileFn (path: string) => string — injected so this works in bundlers.
 * @returns {object} Raw format options from the config file (may be partial).
 */
export function loadConfig(configPath, readFileFn) {
    try {
        const raw = readFileFn(configPath);
        const parsed = JSON.parse(raw);
        return parsed.format ?? {};
    } catch {
        return {};
    }
}

/**
 * Merge format options: defaults < config file < caller-supplied overrides.
 * All values are validated; unknown keys and invalid values are silently ignored.
 * @param {object} fromConfig   Options from .mimorc (may be partial or empty).
 * @param {object} fromCaller   Options passed directly by the caller (highest priority).
 * @returns {object} Fully-resolved format options object.
 */
export function mergeOptions(fromConfig = {}, fromCaller = {}) {
    const merged = { ...DEFAULT_FORMAT_OPTIONS };

    // Apply config-file values
    if (typeof fromConfig.indentSize === 'number' && fromConfig.indentSize > 0) {
        merged.indentSize = fromConfig.indentSize;
    }
    if (typeof fromConfig.useTabs === 'boolean') {
        merged.useTabs = fromConfig.useTabs;
    }
    if (fromConfig.quoteStyle === 'single' || fromConfig.quoteStyle === 'double') {
        merged.quoteStyle = fromConfig.quoteStyle;
    }
    if (typeof fromConfig.maxInlineArrayLength === 'number' && fromConfig.maxInlineArrayLength > 0) {
        merged.maxInlineArrayLength = fromConfig.maxInlineArrayLength;
    }
    if (typeof fromConfig.maxInlineObjectLength === 'number' && fromConfig.maxInlineObjectLength > 0) {
        merged.maxInlineObjectLength = fromConfig.maxInlineObjectLength;
    }

    // Apply caller-supplied overrides (same validation)
    if (typeof fromCaller.indentSize === 'number' && fromCaller.indentSize > 0) {
        merged.indentSize = fromCaller.indentSize;
    }
    if (typeof fromCaller.useTabs === 'boolean') {
        merged.useTabs = fromCaller.useTabs;
    }
    if (fromCaller.quoteStyle === 'single' || fromCaller.quoteStyle === 'double') {
        merged.quoteStyle = fromCaller.quoteStyle;
    }
    if (typeof fromCaller.maxInlineArrayLength === 'number' && fromCaller.maxInlineArrayLength > 0) {
        merged.maxInlineArrayLength = fromCaller.maxInlineArrayLength;
    }
    if (typeof fromCaller.maxInlineObjectLength === 'number' && fromCaller.maxInlineObjectLength > 0) {
        merged.maxInlineObjectLength = fromCaller.maxInlineObjectLength;
    }

    return merged;
}
