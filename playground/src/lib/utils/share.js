/**
 * Share utility functions for the playground
 */

/**
 * Encode text to base64
 * @param {string} text
 * @returns {string}
 */
export function encodeShareBase64(text) {
	const bytes = new TextEncoder().encode(text);
	let binary = '';
	for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
	return btoa(binary);
}

/**
 * Decode base64 to text
 * @param {string} base64
 * @returns {string}
 */
export function decodeShareBase64(base64) {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
	return new TextDecoder().decode(bytes);
}

/**
 * Sanitize a shared path to prevent directory traversal
 * @param {string} path
 * @returns {string}
 */
export function sanitizeSharedPath(path) {
	const normalized = String(path || '')
		.replace(/\\/g, '/')
		.replace(/^\/+/, '')
		.replace(/\/+/g, '/')
		.trim();
	if (!normalized || normalized.includes('..')) return 'shared/shared.mimo';
	return normalized;
}
