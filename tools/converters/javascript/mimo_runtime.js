/**
 * The Mimo JavaScript runtime (Full Version).
 * Provides JS implementations for Mimo's built-ins and standard library.
 */
import fs from 'node:fs'; 

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
    if_else:  (cond, ifTrue, ifFalse) => {
        if (typeof cond === 'function') {
            cond = cond();
        }
        return cond ? ifTrue : ifFalse;
    },
    coalesce: (...args) => {
        for (const arg of args) {
            if (arg !== null && arg !== undefined) {
                return arg;
            }
        }
        return null;
    },
    get_property_safe: (obj, prop) => {
        if (obj && typeof obj === 'object' && prop in obj) {
            return obj[prop];
        }
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
            return fmt.replace(/YYYY/g, d.getFullYear())
                .replace(/MM/g, String(d.getMonth() + 1).padStart(2, '0'))
                .replace(/DD/g, String(d.getDate()).padStart(2, '0'))
                .replace(/hh/g, String(d.getHours()).padStart(2, '0'))
                .replace(/mm/g, String(d.getMinutes()).padStart(2, '0'))
                .replace(/ss/g, String(d.getSeconds()).padStart(2, '0'));
        }
    },
    math: { ...Math, PI: Math.PI, E: Math.E },
    string: { // Add key string functions
        to_upper: (s) => s.toUpperCase(),
        to_lower: (s) => s.toLowerCase(),
        trim: (s) => s.trim(),
        split: (s, sep) => s.split(sep),
        contains: (s, sub) => s.includes(sub),
        starts_with: (s, sub) => s.startsWith(sub),
        ends_with: (s, sub) => s.endsWith(sub),
        replace: (s, find, rep) => s.replace(find, rep),
        replace_all: (s, find, rep) => s.replaceAll(find, rep),
    },
    array: { // Add key array functions
        map: (arr, cb) => arr.map(cb),
        filter: (arr, cb) => arr.filter(cb),
        reduce: (arr, cb, init) => arr.reduce(cb, init),
        for_each: (arr, cb) => arr.forEach(cb),
        find: (arr, cb) => arr.find(cb),
        find_index: (arr, cb) => arr.findIndex(cb),
        slice: (arr, start, end) => arr.slice(start, end),
        sort: (arr) => [...arr].sort(),
        reverse: (arr) => [...arr].reverse(),
        concat: (...arrs) => [].concat(...arrs),
        includes: (arr, val) => arr.includes(val),
    },
    slice: (arr, start, end) => {
        if (end === undefined) end = arr.length;
        return arr.slice(start, end);
    },
    get_arguments: () => {
        return process.argv.slice(2);
    },
    get_env: (name) => {
        return process.env[name] || null;
    },
};