/**
 * @file The entry point for the Mimo web bundle.
 */
import { Mimo } from '../index.web.js';
import { browserAdapter } from '../adapters/browserAdapter.js';

// Expose the Mimo class and the browser adapter to the global scope
window.Mimo = Mimo;
window.mimoBrowserAdapter = browserAdapter;