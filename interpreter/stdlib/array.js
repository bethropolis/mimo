import { BuiltinFunction } from '../BuiltinFunction.js';

// Import all categorized array functions
import {
    arrayMap,
    arrayFilter,
    arrayReduce,
    arrayForEach,
    arrayFind,
    arrayFindIndex
} from './array/higherOrderFunctions.js';

import {
    arrayIncludes,
    arrayIndexOf,
    arrayLastIndexOf
} from './array/searchFunctions.js';

import {
    arraySlice,
    arrayFirst,
    arrayLast,
    arrayIsEmpty
} from './array/accessFunctions.js';

import {
    arraySort,
    arrayReverse,
    arrayConcat
} from './array/transformationFunctions.js';

// --- Module Definition ---
export const arrayModule = {
    map: arrayMap,
    filter: arrayFilter,
    reduce: arrayReduce,
    for_each: arrayForEach,
    find: arrayFind,
    find_index: arrayFindIndex,
    includes: arrayIncludes,
    index_of: arrayIndexOf,
    last_index_of: arrayLastIndexOf,
    slice: arraySlice,
    first: arrayFirst,
    last: arrayLast,
    is_empty: arrayIsEmpty,
    sort: arraySort,
    reverse: arrayReverse,
    concat: arrayConcat,
};

// --- Initialize Function ---
export function initializeArrayModule(environment) {
    const arrayModuleObject = {};
    for (const [name, func] of Object.entries(arrayModule)) {
        arrayModuleObject[name] = func;
    }
    environment.define('Array', arrayModuleObject);
}