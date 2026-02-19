import { BuiltinFunction } from '../BuiltinFunction.js';
import { ErrorHandler } from '../ErrorHandler.js';

// --- Constants ---
const MIMO_PI = Math.PI;
const MIMO_E = Math.E;

// --- Seeded Randomness ---
let _currentSeed = null;

function seededRandom() {
    if (_currentSeed === null) return Math.random();
    // Park-Miller LCG
    _currentSeed = (_currentSeed * 16807) % 2147483647;
    return (_currentSeed - 1) / 2147483646;
}


// --- Helper for type checking ---
// Helper for type checking --- Updated
function expectNumber(arg, funcName, interpreter, callNode, argPosition = 1) {
    if (typeof arg !== 'number') {
        throw interpreter.errorHandler.createRuntimeError(
            `${funcName}() expects a number as argument ${argPosition}. Got '${typeof arg}'.`,
            callNode, // Pass callNode
            'TYPE001',
            `Ensure argument ${argPosition} for '${funcName}' is a number.`
        );
    }
}

function expectNumbers(args, funcName, expectedCount, interpreter, callNode) {
    if (args.length < expectedCount) {
        throw interpreter.errorHandler.createRuntimeError(
            `${funcName}() expects at least ${expectedCount} arguments, got ${args.length}.`,
            callNode, // Pass callNode
            'BUILTIN001',
            `Provide at least ${expectedCount} arguments for '${funcName}'.`
        );
    }
    for (let i = 0; i < expectedCount; i++) {
        if (typeof args[i] !== 'number') {
            throw interpreter.errorHandler.createRuntimeError(
                `${funcName}() expects a number as argument ${i + 1}. Got '${typeof args[i]}'.`,
                callNode, // Pass callNode
                'TYPE001',
                `Ensure argument ${i + 1} for '${funcName}' is a number.`
            );
        }
    }
}

// --- BuiltinFunction Definitions ---

const mathSin = new BuiltinFunction("sin", (args, interpreter, callNode) => {
    expectNumber(args[0], "sin", interpreter, callNode, 1);
    return Math.sin(args[0]);
}, 1);

const mathCos = new BuiltinFunction("cos", (args, interpreter, callNode) => {
    expectNumber(args[0], "cos", interpreter, callNode, 1);
    return Math.cos(args[0]);
}, 1);

const mathTan = new BuiltinFunction("tan", (args, interpreter, callNode) => {
    expectNumber(args[0], "tan", interpreter, callNode, 1);
    return Math.tan(args[0]);
}, 1);

const mathAsin = new BuiltinFunction("asin", (args, interpreter, callNode) => {
    expectNumber(args[0], "asin", interpreter, callNode, 1);
    return Math.asin(args[0]);
}, 1);

const mathAcos = new BuiltinFunction("acos", (args, interpreter, callNode) => {
    expectNumber(args[0], "acos", interpreter, callNode, 1);
    return Math.acos(args[0]);
}, 1);

const mathAtan = new BuiltinFunction("atan", (args, interpreter, callNode) => {
    expectNumber(args[0], "atan", interpreter, callNode, 1);
    return Math.atan(args[0]);
}, 1);

const mathAtan2 = new BuiltinFunction("atan2", (args, interpreter, callNode) => {
    expectNumbers(args, "atan2", 2, interpreter, callNode);
    return Math.atan2(args[0], args[1]); // y, x
}, 2);

const mathLog = new BuiltinFunction("log", (args, interpreter, callNode) => { // Natural logarithm
    expectNumber(args[0], "log", interpreter, callNode, 1);
    return Math.log(args[0]);
}, 1);

const mathLog10 = new BuiltinFunction("log10", (args, interpreter, callNode) => {
    expectNumber(args[0], "log10", interpreter, callNode, 1);
    return Math.log10(args[0]);
}, 1);

const mathLog2 = new BuiltinFunction("log2", (args, interpreter, callNode) => {
    expectNumber(args[0], "log2", interpreter, callNode, 1);
    return Math.log2(args[0]);
}, 1);

const mathExp = new BuiltinFunction("exp", (args, interpreter, callNode) => {
    expectNumber(args[0], "exp", interpreter, callNode, 1);
    return Math.exp(args[0]);
}, 1);

const mathPow = new BuiltinFunction("pow", (args, interpreter, callNode) => {
    expectNumbers(args, "pow", 2, interpreter, callNode);
    return Math.pow(args[0], args[1]); // base, exponent
}, 2);

const mathSqrt = new BuiltinFunction("sqrt", (args, interpreter, callNode) => {
    expectNumber(args[0], "sqrt", interpreter, callNode, 1);
    return Math.sqrt(args[0]);
}, 1);

const mathCbrt = new BuiltinFunction("cbrt", (args, interpreter, callNode) => {
    expectNumber(args[0], "cbrt", interpreter, callNode, 1);
    return Math.cbrt(args[0]);
}, 1);

const mathFloor = new BuiltinFunction("floor", (args, interpreter, callNode) => {
    expectNumber(args[0], "floor", interpreter, callNode, 1);
    return Math.floor(args[0]);
}, 1);

const mathCeil = new BuiltinFunction("ceil", (args, interpreter, callNode) => {
    expectNumber(args[0], "ceil", interpreter, callNode, 1);
    return Math.ceil(args[0]);
}, 1);

const mathRound = new BuiltinFunction("round", (args, interpreter, callNode) => {
    expectNumber(args[0], "round", interpreter, callNode, 1);
    return Math.round(args[0]);
}, 1);

const mathAbs = new BuiltinFunction("abs", (args, interpreter, callNode) => {
    expectNumber(args[0], "abs", interpreter, callNode, 1);
    return Math.abs(args[0]);
}, 1);

// Variadic min/max
const mathMax = new BuiltinFunction("max", (args, interpreter, callNode) => {
    if (args.length === 0) {
        throw interpreter.errorHandler.createRuntimeError(
            "max() expects at least one number.",
            callNode,
            'BUILTIN001',
            "Provide at least one number to max()."
        );
    }
    args.forEach((arg, i) => expectNumber(arg, "max", interpreter, callNode, i + 1));
    return Math.max(...args);
}, [1, Infinity]); // Arity: 1 to many



const mathMin = new BuiltinFunction("min", (args, interpreter, callNode) => {
    if (args.length === 0) {
        throw interpreter.errorHandler.createRuntimeError(
            "min() expects at least one number.",
            callNode,
            'BUILTIN001',
            "Provide at least one number to min()."
        );
    }
    args.forEach((arg, i) => expectNumber(arg, "min", interpreter, callNode, i + 1));
    return Math.min(...args);
}, [1, Infinity]); // Arity: 1 to many

// random
const mathRandom = new BuiltinFunction("random", (args, interpreter, callNode) => {
    return seededRandom();
}, 0); // No arguments, returns a random number between 0 and 1

const mathSeed = new BuiltinFunction("seed", (args, interpreter, callNode) => {
    expectNumber(args[0], "seed", interpreter, callNode, 1);
    _currentSeed = Math.abs(Math.floor(args[0])) % 2147483647;
    if (_currentSeed === 0) _currentSeed = 1; // Seed cannot be 0 for this LCG
    return null;
}, 1);

const mathRandInt = new BuiltinFunction("randint", (args, interpreter, callNode) => {
    expectNumbers(args, "randint", 2, interpreter, callNode);
    const min = Math.ceil(args[0]);
    const max = Math.floor(args[1]);
    return Math.floor(seededRandom() * (max - min + 1)) + min;
}, 2);




// --- Export the module's contents ---
export const mathModuleExports = {
    PI: MIMO_PI,
    E: MIMO_E,
    sin: mathSin,
    cos: mathCos,
    tan: mathTan,
    asin: mathAsin,
    acos: mathAcos,
    atan: mathAtan,
    atan2: mathAtan2,
    log: mathLog,
    log10: mathLog10,
    log2: mathLog2,
    exp: mathExp,
    pow: mathPow,
    sqrt: mathSqrt,
    cbrt: mathCbrt,
    floor: mathFloor,
    ceil: mathCeil,
    round: mathRound,
    abs: mathAbs,
    max: mathMax,
    min: mathMin,
    random: mathRandom,
    seed: mathSeed,
    randint: mathRandInt,
};

