/**
 * Mimo runner module - manages web worker for code execution
 * Uses Svelte 5 runes for reactive state
 */

import MimoRunnerWorker from './mimo-runner.worker.js?worker';

/**
 * Create a reactive runner instance
 * @returns {{
 *   worker: Worker | null;
 *   runInWorker: (payload: { source: string; filePath: string; files: Record<string, string> }) => Promise<any>;
 *   evalInWorker: (payload: { source: string; files?: Record<string, string> }) => Promise<any>;
 *   lintInWorker: (payload: { source: string; filePath: string; rules?: Record<string, boolean> }) => Promise<any>;
 *   formatInWorker: (payload: { source: string }) => Promise<any>;
 *   terminate: () => void;
 * }}
 */
export function createRunner() {
	/** @type {Worker | null} */
	let worker = $state(null);
	let requestId = 0;
	/** @type {Map<number, { resolve: (value: any) => void; reject: (error: unknown) => void }>} */
	const pending = new Map();

	function ensureWorker() {
		if (worker) return worker;
		worker = new MimoRunnerWorker();
		worker.addEventListener('message', (event) => {
			const payload = event.data;
			if (!payload || typeof payload.id !== 'number') return;
			const handler = pending.get(payload.id);
			if (!handler) return;
			pending.delete(payload.id);
			const okTypes = ['run:ok', 'lint:ok', 'format:ok'];
			if (okTypes.includes(payload.type)) handler.resolve(payload);
			else handler.reject(payload.error ?? 'Unknown worker error');
		});
		return worker;
	}

	/**
	 * Run code in the worker
	 * @param {{ source: string; filePath: string; files: Record<string, string> }} payload
	 * @returns {Promise<any>}
	 */
	function runInWorker(payload) {
		const w = ensureWorker();
		const id = ++requestId;
		return new Promise((resolve, reject) => {
			pending.set(id, { resolve, reject });
			w.postMessage({ type: 'run', id, ...payload });
		});
	}

	/**
	 * Eval code in the worker (persistent context)
	 * @param {{ source: string; files?: Record<string, string> }} payload
	 * @returns {Promise<any>}
	 */
	function evalInWorker(payload) {
		const w = ensureWorker();
		const id = ++requestId;
		return new Promise((resolve, reject) => {
			pending.set(id, { resolve, reject });
			w.postMessage({ type: 'eval', id, ...payload });
		});
	}

	/**
	 * Lint code in the worker
	 * @param {{ source: string; filePath: string; rules?: Record<string, boolean> }} payload
	 * @returns {Promise<{ ok: boolean; messages: Array; file: string; error?: any }>}
	 */
	function lintInWorker(payload) {
		const w = ensureWorker();
		const id = ++requestId;
		return new Promise((resolve, reject) => {
			pending.set(id, { resolve, reject });
			w.postMessage({ type: 'lint', id, ...payload });
		});
	}

	/**
	 * Format code in the worker
	 * @param {{ source: string }} payload
	 * @returns {Promise<{ formatted: string }>}
	 */
	function formatInWorker(payload) {
		const w = ensureWorker();
		const id = ++requestId;
		return new Promise((resolve, reject) => {
			pending.set(id, { resolve, reject });
			w.postMessage({ type: 'format', id, ...payload });
		});
	}

	function terminate() {
		if (worker) {
			// Reject all pending requests
			for (const handler of pending.values()) {
				handler.reject(new Error('Execution worker disposed.'));
			}
			pending.clear();
			worker.terminate();
			worker = null;
		}
	}

	return {
		get worker() { return worker; },
		runInWorker,
		evalInWorker,
		lintInWorker,
		formatInWorker,
		terminate
	};
}
