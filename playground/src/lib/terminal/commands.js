/**
 * Terminal command system for Mimo Playground
 * Modular command registry with help, file operations, and Mimo execution
 */

/**
 * @typedef {{
 *   name: string;
 *   description: string;
 *   usage?: string;
 *   aliases?: string[];
 *   execute: (args: string[], context: CommandContext) => CommandResult | Promise<CommandResult>;
 * }} Command
 */

/**
 * @typedef {{
 *   fs: {
 *     readFile: (path: string) => string | null;
 *     writeFile: (path: string, content: string) => void;
 *     exists: (path: string) => boolean;
 *     isDirectory: (path: string) => boolean;
 *     listDir: (path: string) => Array<{ name: string; isDirectory: boolean }>;
 *     pwd: () => string;
 *   };
 *   runner: {
 *     eval: (source: string) => Promise<{ output: string[] }>;
 *     run: (file: string) => Promise<void>;
 *   };
 *   workspace: {
 *     snapshot: () => Record<string, string>;
 *     activeFile: string;
 *   };
 *   terminal: {
 *     clear: () => void;
 *     log: (level: 'info'|'success'|'error'|'warning', message: string) => void;
 *   };
 * }} CommandContext
 */

/**
 * @typedef {{
 *   output?: string[];
 *   level?: 'info'|'success'|'error'|'warning';
 *   clear?: boolean;
 * }} CommandResult
 */

/** @param {string} path */
function normalizePath(path) {
	return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

/** @param {...string} segments */
function joinPath(...segments) {
	return normalizePath(segments.join('/'));
}

/** @type {Record<string, Command>} */
const commands = {
	help: {
		name: 'help',
		description: 'Show available commands and usage',
		usage: 'help [command]',
		aliases: ['?'],
		/** @param {string[]} args @param {CommandContext} ctx @returns {CommandResult} */
		execute: (args, ctx) => {
			if (args[0]) {
				const cmd = findCommand(args[0]);
				if (!cmd) {
					return { output: [`Unknown command: ${args[0]}`], level: 'error' };
				}
				/** @type {string[]} */
				const lines = [
					`${cmd.name}${cmd.aliases ? ` (${cmd.aliases.join(', ')})` : ''}`,
					`  ${cmd.description}`
				];
				if (cmd.usage) lines.push(`  Usage: ${cmd.usage}`);
				return { output: lines };
			}
			
			const cmdList = Object.values(commands).filter(c => !c.name.startsWith('_'));
			const maxLen = Math.max(...cmdList.map(c => c.name.length));
			
			return {
				output: [
					'Available commands:',
					'',
					...cmdList.map(c => `  ${c.name.padEnd(maxLen)}  ${c.description}`),
					'',
					'Type `help <command>` for detailed usage.',
					'',
					'Tip: Any other input is executed as Mimo code!'
				]
			};
		}
	},

	clear: {
		name: 'clear',
		description: 'Clear terminal output',
		aliases: ['cls'],
		/** @returns {CommandResult} */
		execute: () => ({ clear: true })
	},

	ls: {
		name: 'ls',
		description: 'List files and directories',
		usage: 'ls [path]',
		aliases: ['dir'],
		/** @param {string[]} args @param {CommandContext} ctx @returns {CommandResult} */
		execute: (args, ctx) => {
			const path = normalizePath(args[0] || ctx.fs.pwd());
			const entries = ctx.fs.listDir(path);
			
			if (entries.length === 0) {
				return { output: [`(empty directory)`] };
			}
			
			const sorted = entries.sort((a, b) => {
				if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
				return a.name.localeCompare(b.name);
			});
			
			return {
				output: [
					`  ${path}/`,
					...sorted.map(e => {
						const icon = e.isDirectory ? '📁' : '📄';
						return `  ${icon} ${e.name}${e.isDirectory ? '/' : ''}`;
					})
				]
			};
		}
	},

	cat: {
		name: 'cat',
		description: 'Display file contents',
		usage: 'cat <file>',
		/** @param {string[]} args @param {CommandContext} ctx @returns {CommandResult} */
		execute: (args, ctx) => {
			if (!args[0]) {
				return { output: ['Usage: cat <file>'], level: 'error' };
			}
			
			const path = normalizePath(args[0]);
			const content = ctx.fs.readFile(path);
			
			if (content === null) {
				return { output: [`File not found: ${path}`], level: 'error' };
			}
			
			return { output: content.split('\n') };
		}
	},

	pwd: {
		name: 'pwd',
		description: 'Print working directory',
		/** @param {string[]} args @param {CommandContext} ctx @returns {CommandResult} */
		execute: (args, ctx) => ({ output: [ctx.fs.pwd()] })
	},

	cd: {
		name: 'cd',
		description: 'Change working directory (virtual, for display)',
		usage: 'cd <path>',
		/** @param {string[]} args @param {CommandContext} ctx @returns {CommandResult} */
		execute: (args, ctx) => {
			return { output: ['Note: cd is not supported in the playground. All paths are relative to workspace root.'] };
		}
	},

	run: {
		name: 'run',
		description: 'Run a Mimo file',
		usage: 'run [file]',
		/** @param {string[]} args @param {CommandContext} ctx @returns {Promise<CommandResult>} */
		execute: async (args, ctx) => {
			const file = args[0] || ctx.workspace.activeFile;
			ctx.terminal.log('info', `Running ${file}...`);
			await ctx.runner.run(file);
			return { output: [] };
		}
	},

	files: {
		name: 'files',
		description: 'List all files in workspace',
		/** @param {string[]} args @param {CommandContext} ctx @returns {CommandResult} */
		execute: (args, ctx) => {
			const snapshot = ctx.workspace.snapshot();
			const files = Object.keys(snapshot);
			
			if (files.length === 0) {
				return { output: ['No files in workspace.'] };
			}
			
			return {
				output: [
					`Workspace files (${files.length}):`,
					...files.map(f => `  📄 ${f}`)
				]
			};
		}
	},

	echo: {
		name: 'echo',
		description: 'Print text to terminal',
		usage: 'echo <text>',
		/** @param {string[]} args @returns {CommandResult} */
		execute: (args) => ({ output: [args.join(' ')] })
	},

	version: {
		name: 'version',
		description: 'Show Mimo version info',
		aliases: ['ver'],
		/** @returns {CommandResult} */
		execute: () => ({
			output: [
				'Mimo Playground v1.0.0',
				'A minimal prefix-notation programming language'
			]
		})
	}
};

/**
 * Find a command by name or alias
 * @param {string} name
 * @returns {Command | null}
 */
function findCommand(name) {
	const normalizedName = name.toLowerCase();
	
	for (const cmd of Object.values(commands)) {
		if (cmd.name === normalizedName) return cmd;
		if (cmd.aliases?.includes(normalizedName)) return cmd;
	}
	
	return null;
}

/**
 * Parse a command string into command name and arguments
 * @param {string} input
 * @returns {{ command: string; args: string[] } | null}
 */
function parseCommand(input) {
	const trimmed = input.trim();
	if (!trimmed) return null;
	
	// Handle quoted strings
	/** @type {string[]} */
	const parts = [];
	let current = '';
	let inQuote = false;
	let quoteChar = '';
	
	for (let i = 0; i < trimmed.length; i++) {
		const char = trimmed[i];
		
		if (inQuote) {
			if (char === quoteChar) {
				inQuote = false;
			} else {
				current += char;
			}
		} else if (char === '"' || char === "'") {
			inQuote = true;
			quoteChar = char;
		} else if (char === ' ' || char === '\t') {
			if (current) {
				parts.push(current);
				current = '';
			}
		} else {
			current += char;
		}
	}
	
	if (current) parts.push(current);
	
	if (parts.length === 0) return null;
	
	return {
		command: parts[0],
		args: parts.slice(1)
	};
}

/**
 * Execute a terminal command
 * @param {string} input
 * @param {CommandContext} context
 * @returns {Promise<CommandResult>}
 */
async function executeCommand(input, context) {
	const parsed = parseCommand(input);
	
	if (!parsed) return { output: [] };
	
	const cmd = findCommand(parsed.command);
	
	if (cmd) {
		return await cmd.execute(parsed.args, context);
	}
	
	// Not a command - treat as Mimo code
	context.terminal.log('info', `> ${input}`);
	
	try {
		const result = await context.runner.eval(input);
		
		if (result.output?.length) {
			return {
				output: result.output,
				level: 'success'
			};
		}
		
		return { output: ['(no output)'] };
	} catch (error) {
		return {
			output: [String(error)],
			level: 'error'
		};
	}
}

/**
 * Get command suggestions for autocomplete
 * @param {string} partial
 * @returns {string[]}
 */
function getCommandSuggestions(partial) {
	const suggestions = [];
	
	for (const cmd of Object.values(commands)) {
		if (cmd.name.startsWith(partial)) {
			suggestions.push(cmd.name);
		}
		for (const alias of cmd.aliases || []) {
			if (alias.startsWith(partial)) {
				suggestions.push(alias);
			}
		}
	}
	
	return [...new Set(suggestions)].sort();
}

export {
	commands,
	findCommand,
	parseCommand,
	executeCommand,
	getCommandSuggestions
};
