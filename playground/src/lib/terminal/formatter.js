/**
 * Terminal output formatting utilities
 */

/**
 * @typedef {'command'|'output'|'error'|'warning'|'success'|'info'|'system'} OutputType
 */

/**
 * @typedef {{
 *   id: string;
 *   type: OutputType;
 *   content: string;
 *   timestamp: string;
 *   isCollapsible?: boolean;
 *   isCollapsed?: boolean;
 * }} TerminalEntry
 */

let entryId = 0;

function generateId() {
	return `entry-${++entryId}`;
}

function timestamp() {
	return new Date().toLocaleTimeString('en-US', { hour12: false });
}

/**
 * Create a terminal entry
 * @param {OutputType} type
 * @param {string|string[]} content
 * @returns {TerminalEntry}
 */
function createEntry(type, content) {
	return {
		id: generateId(),
		type,
		content: Array.isArray(content) ? content.join('\n') : content,
		timestamp: timestamp(),
		isCollapsible: Array.isArray(content) && content.length > 5,
		isCollapsed: false
	};
}

/**
 * Format command input for display
 * @param {string} command
 * @returns {TerminalEntry}
 */
function formatCommand(command) {
	return createEntry('command', `$ ${command}`);
}

/**
 * Format output for display
 * @param {string|string[]} output
 * @param {OutputType} type
 * @returns {TerminalEntry}
 */
function formatOutput(output, type = 'output') {
	return createEntry(type, output);
}

/**
 * Format error for display
 * @param {string|Error} error
 * @returns {TerminalEntry}
 */
function formatError(error) {
	const message = error instanceof Error ? error.message : String(error);
	return createEntry('error', message);
}

/**
 * Format system message
 * @param {string} message
 * @returns {TerminalEntry}
 */
function formatSystem(message) {
	return createEntry('system', message);
}

/**
 * Get CSS classes for entry type
 * @param {OutputType} type
 * @returns {string}
 */
function getTypeClasses(type) {
	/** @type {Record<OutputType, string>} */
	const classes = {
		command: 'text-accent font-semibold',
		output: 'text-text-muted',
		error: 'text-rose-400',
		warning: 'text-amber-400',
		success: 'text-emerald-400',
		info: 'text-sky-400',
		system: 'text-text-soft italic text-xs'
	};
	
	return classes[type] || classes.output;
}

/**
 * Get prefix for entry type
 * @param {OutputType} type
 * @returns {string}
 */
function getTypePrefix(type) {
	/** @type {Record<OutputType, string>} */
	const prefixes = {
		command: '❯',
		output: '',
		error: '✗',
		warning: '⚠',
		success: '✓',
		info: 'ℹ',
		system: '◆'
	};
	
	return prefixes[type] || '';
}

export {
	createEntry,
	formatCommand,
	formatOutput,
	formatError,
	formatSystem,
	getTypeClasses,
	getTypePrefix,
	timestamp
};
