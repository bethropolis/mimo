import { BuiltinFunction } from '../BuiltinFunction.js';

// --- Helper for Type Checking ---
function expectDate(arg, funcName, interpreter, callNode) {
    if (!(arg instanceof Date)) {
        throw interpreter.errorHandler.createRuntimeError(
            `${funcName}() expects a datetime object as its first argument.`,
            callNode, 'TYPE001', 'Use a value returned from datetime.now() or datetime.from_timestamp().'
        );
    }
}

// --- BuiltinFunction Definitions ---

const dtNow = new BuiltinFunction("now",
    () => {
        // Returns a new JavaScript Date object representing the current moment.
        return new Date();
    },
    0
);

const dtGetTimestamp = new BuiltinFunction("get_timestamp",
    (args, interpreter, callNode) => {
        const [dateObj] = args;
        expectDate(dateObj, "datetime.get_timestamp", interpreter, callNode);
        // Returns the number of milliseconds since the ECMAScript epoch.
        return dateObj.getTime();
    },
    1
);

const dtFromTimestamp = new BuiltinFunction("from_timestamp",
    ([timestamp], interpreter, callNode) => {
        if (typeof timestamp !== 'number') {
            throw interpreter.errorHandler.createRuntimeError(
                `datetime.from_timestamp() expects a number (milliseconds). Got '${typeof timestamp}'.`,
                callNode, 'TYPE001', 'Provide a numeric timestamp.'
            );
        }
        // Returns a new Date object from the timestamp.
        return new Date(timestamp);
    },
    1
);

const dtToISOString = new BuiltinFunction("to_iso_string",
    ([dateObj], interpreter, callNode) => {
        expectDate(dateObj, "datetime.to_iso_string", interpreter, callNode);
        // Returns a string in simplified extended ISO format (ISO 8601), which is always 24 or 27 characters long.
        return dateObj.toISOString();
    },
    1
);

const dtFormat = new BuiltinFunction("format",
    (args, interpreter, callNode) => {
        const [dateObj, formatStr] = args;
        expectDate(dateObj, "datetime.format", interpreter, callNode);
        if (typeof formatStr !== 'string') {
            throw interpreter.errorHandler.createRuntimeError(
                `datetime.format() expects a format string as its second argument. Got '${typeof formatStr}'.`,
                callNode, 'TYPE001', 'Provide a format string (e.g., "YYYY-MM-DD").'
            );
        }

        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');

        let formatted = formatStr;
        formatted = formatted.replace(/YYYY/g, year);
        formatted = formatted.replace(/MM/g, month);
        formatted = formatted.replace(/DD/g, day);
        formatted = formatted.replace(/hh/g, hours);
        formatted = formatted.replace(/mm/g, minutes);
        formatted = formatted.replace(/ss/g, seconds);

        return formatted;
    },
    2
);


// --- Module Export ---
export const datetimeModule = {
    now: dtNow,
    get_timestamp: dtGetTimestamp,
    from_timestamp: dtFromTimestamp,
    to_iso_string: dtToISOString,
    format: dtFormat,
};