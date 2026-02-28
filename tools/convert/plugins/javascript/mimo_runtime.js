/**
 * The Mimo JavaScript runtime (Full Version).
 * Provides JS implementations for Mimo's built-ins and standard library.
 */
import fs from 'node:fs';
import nodePath from 'node:path';

// Helper for deep equality checks
function isEqual(a, b) {
    if (a === b) return true;
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    if (!a || !b || (typeof a !== 'object' && typeof b !== 'object')) return a === b;
    if (a.prototype !== b.prototype) return false;
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;
    return keys.every(k => isEqual(a[k], b[k]));
}

// Main runtime object
export const mimo = {
    // --- Core IO & Utils ---
    show: (...args) => console.log(...args.map(mimo.stringify)),
    stringify: (value) => {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (Array.isArray(value)) return `[${value.map(mimo.stringify).join(', ')}]`;
        if (value instanceof Date) return `datetime(${value.toISOString()})`;
        if (typeof value === 'object') {
            const pairs = Object.entries(value).map(([k, v]) => `${k}: ${mimo.stringify(v)}`);
            return `{${pairs.join(', ')}}`;
        }
        return String(value);
    },

    // --- Core Built-ins ---
    len: (c) => c?.length ?? (typeof c === 'object' ? Object.keys(c).length : 0),
    get: (c, k) => c?.[k] ?? null,
    update: (c, k, v) => { c[k] = v; return v; },
    type: (v) => v === null ? 'null' : (Array.isArray(v) ? 'array' : typeof v),
    push: (arr, v) => { arr.push(v); return arr; },
    pop: (arr) => arr.pop(),
    range: (start, end, step = 1) => {
        const result = [];
        if (end === undefined) { end = start; start = 0; }
        for (let i = start; step > 0 ? i < end : i > end; i += step) {
            result.push(i);
        }
        return result;
    },
    join: (arr, sep) => arr.map(mimo.stringify).join(sep),

    // --- Logical Operators (as functions) ---
    eq: (a, b) => isEqual(a, b),
    neq: (a, b) => !isEqual(a, b),
    and: (a, b) => a && b,
    or: (a, b) => a || b,
    if_else: (cond, ifTrue, ifFalse) => {
        if (typeof cond === 'function') cond = cond();
        return cond ? ifTrue : ifFalse;
    },
    coalesce: (...args) => {
        for (const arg of args) {
            if (arg !== null && arg !== undefined) return arg;
        }
        return null;
    },
    get_property_safe: (obj, prop) => {
        if (obj && typeof obj === 'object' && prop in obj) return obj[prop];
        return null;
    },

    // --- Standard Library Modules ---
    fs: {
        read_file: (path) => fs.readFileSync(path, 'utf-8'),
        write_file: (path, data) => fs.writeFileSync(path, data),
        exists: (path) => fs.existsSync(path),
        list_dir: (path) => fs.readdirSync(path),
        make_dir: (path, opts) => fs.mkdirSync(path, opts),
        remove_file: (path) => fs.unlinkSync(path),
        remove_dir: (path, recursive) => fs.rmdirSync(path, { recursive }),
    },
    json: {
        parse: (str) => JSON.parse(str),
        stringify: (obj, indent) => JSON.stringify(obj, null, indent),
    },
    datetime: {
        now: () => new Date(),
        get_timestamp: (d) => d.getTime(),
        from_timestamp: (ts) => new Date(ts),
        to_iso_string: (d) => d.toISOString(),
        format: (d, fmt) => {
            return fmt
                .replace(/YYYY/g, d.getFullYear())
                .replace(/MM/g, String(d.getMonth() + 1).padStart(2, '0'))
                .replace(/DD/g, String(d.getDate()).padStart(2, '0'))
                .replace(/hh/g, String(d.getHours()).padStart(2, '0'))
                .replace(/mm/g, String(d.getMinutes()).padStart(2, '0'))
                .replace(/ss/g, String(d.getSeconds()).padStart(2, '0'));
        },
    },
    math: { ...Math, PI: Math.PI, E: Math.E },
    string: {
        to_upper: (s) => s.toUpperCase(),
        to_lower: (s) => s.toLowerCase(),
        to_title_case: (s) => s.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        capitalize: (s) => s.charAt(0).toUpperCase() + s.slice(1),
        trim: (s) => s.trim(),
        trim_start: (s) => s.trimStart(),
        trim_end: (s) => s.trimEnd(),
        pad_start: (s, len, pad = ' ') => s.padStart(len, pad),
        pad_end: (s, len, pad = ' ') => s.padEnd(len, pad),
        contains: (s, sub, pos = 0) => s.includes(sub, pos),
        starts_with: (s, sub, pos = 0) => s.startsWith(sub, pos),
        ends_with: (s, sub, len) => s.endsWith(sub, len),
        index_of: (s, sub, from = 0) => s.indexOf(sub, from),
        last_index_of: (s, sub, from) => s.lastIndexOf(sub, from),
        substring: (s, start, end) => s.substring(start, end),
        slice: (s, start, end) => s.slice(start, end),
        split: (s, sep, limit) => s.split(sep, limit),
        replace: (s, find, rep) => s.replace(find, rep),
        replace_all: (s, find, rep) => s.replaceAll(find, rep),
        repeat: (s, n) => s.repeat(n),
        char_at: (s, i) => s.charAt(i),
        is_empty: (s) => s.length === 0,
        is_blank: (s) => s.trim().length === 0,
    },
    array: {
        map: (arr, cb) => arr.map(cb),
        filter: (arr, cb) => arr.filter(cb),
        reduce: (arr, cb, init) => init !== undefined ? arr.reduce(cb, init) : arr.reduce(cb),
        flat: (arr, depth = 1) => arr.flat(depth),
        flat_map: (arr, cb) => arr.flatMap(cb),
        group_by: (arr, cb) => {
            const result = {};
            for (const item of arr) {
                const key = String(cb(item));
                (result[key] = result[key] || []).push(item);
            }
            return result;
        },
        zip: (...arrs) => {
            const len = Math.min(...arrs.map(a => a.length));
            return Array.from({ length: len }, (_, i) => arrs.map(a => a[i]));
        },
        chunk: (arr, size) => {
            const result = [];
            for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
            return result;
        },
        count: (arr, cb) => cb ? arr.filter(cb).length : arr.length,
        for_each: (arr, cb) => arr.forEach(cb),
        find: (arr, cb) => arr.find(cb) ?? null,
        find_index: (arr, cb) => arr.findIndex(cb),
        includes: (arr, val) => arr.includes(val),
        index_of: (arr, val, from = 0) => arr.indexOf(val, from),
        last_index_of: (arr, val, from) => from !== undefined ? arr.lastIndexOf(val, from) : arr.lastIndexOf(val),
        slice: (arr, start, end) => arr.slice(start, end),
        first: (arr) => arr.length > 0 ? arr[0] : null,
        last: (arr) => arr.length > 0 ? arr[arr.length - 1] : null,
        is_empty: (arr) => arr.length === 0,
        sort: (arr, cb) => cb ? [...arr].sort(cb) : [...arr].sort(),
        reverse: (arr) => [...arr].reverse(),
        shuffle: (arr) => {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        },
        concat: (...arrs) => [].concat(...arrs),
        unique: (arr) => [...new Set(arr)],
        intersection: (a, b) => a.filter(v => b.includes(v)),
        union: (a, b) => [...new Set([...a, ...b])],
        difference: (a, b) => a.filter(v => !b.includes(v)),
    },
    path: {
        join: (...parts) => nodePath.join(...parts),
        dirname: (p) => nodePath.dirname(p),
        basename: (p, ext) => nodePath.basename(p, ext),
        extname: (p) => nodePath.extname(p),
    },
    env: {
        get: (name, fallback = null) => process.env[name] ?? fallback,
        has: (name) => name in process.env,
        all: () => ({ ...process.env }),
    },
    regex: {
        find_matches: (pattern, text, flags = 'g') => {
            const matches = text.match(new RegExp(pattern, flags));
            return matches ? [...matches] : null;
        },
        is_match: (pattern, text, flags = '') => new RegExp(pattern, flags).test(text),
        replace_all: (text, pattern, replacement, flags = 'g') => text.replace(new RegExp(pattern, flags), replacement),
        extract: (pattern, text, flags = '') => {
            const result = new RegExp(pattern, flags).exec(text);
            return result ? [...result] : null;
        },
    },
    http: {
        get: (url) => {
            // Synchronous HTTP not natively available in Node; users should use async patterns.
            throw new Error('http.get() requires an async environment. Use fetch() directly.');
        },
        post: (url, body, headers = {}) => {
            throw new Error('http.post() requires an async environment. Use fetch() directly.');
        },
    },
    object: {
        merge: (...objs) => Object.assign({}, ...objs),
        pick: (obj, keys) => Object.fromEntries(keys.filter(k => k in obj).map(k => [k, obj[k]])),
        omit: (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k))),
        map_values: (obj, cb) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, cb(v, k, obj)])),
        from_entries: (entries) => Object.fromEntries(entries.map(([k, v]) => [String(k), v])),
        is_empty: (obj) => Object.keys(obj).length === 0,
        keys: (obj) => Object.keys(obj),
        values: (obj) => Object.values(obj),
        entries: (obj) => Object.entries(obj).map(([k, v]) => [k, v]),
    },
    assert: {
        eq: (actual, expected, message) => {
            if (!isEqual(actual, expected)) {
                const msg = message ? `: ${message}` : '';
                throw new Error(`Assertion Failed${msg}.\n   Expected: ${JSON.stringify(expected)}\n   Actual:   ${JSON.stringify(actual)}`);
            }
            return true;
        },
        neq: (actual, expected, message) => {
            if (isEqual(actual, expected)) {
                const msg = message ? `: ${message}` : '';
                throw new Error(`Assertion Failed${msg}. Expected values to be different.`);
            }
            return true;
        },
        true: (condition, message) => {
            if (condition !== true) {
                const msg = message ? `: ${message}` : '';
                throw new Error(`Assertion Failed${msg}. Expected true, got ${JSON.stringify(condition)}`);
            }
            return true;
        },
        false: (condition, message) => {
            if (condition !== false) {
                const msg = message ? `: ${message}` : '';
                throw new Error(`Assertion Failed${msg}. Expected false, got ${JSON.stringify(condition)}`);
            }
            return true;
        },
        throws: (fn, message) => {
            try {
                fn();
            } catch (_) {
                return true;
            }
            const msg = message ? `: ${message}` : '';
            throw new Error(`Assertion Failed${msg}. Expected function to throw, but it did not.`);
        },
    },
    slice: (arr, start, end) => {
        if (end === undefined) end = arr.length;
        return arr.slice(start, end);
    },
    get_arguments: () => process.argv.slice(2),
    get_env: (name) => process.env[name] || null,
};
