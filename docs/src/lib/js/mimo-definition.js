import Prism from 'prismjs';

Prism.languages.mimo = {
	 // Highlights function names declared with "function" keyword
	 'function-declaration': {
        pattern: /(?<=\bfunction\b\s)\b[a-zA-Z_][a-zA-Z0-9_]*\b/,
        alias: 'entity.name.function.declaration.mimo',
        greedy: true
    },
    // Highlights function names used in calls
    'function-call': {
        pattern: /(?<=\bcall\b\s)\b[a-zA-Z_][a-zA-Z0-9_]*\b/,
        alias: 'entity.name.function.call.mimo'
    },
    // Highlights function parameters within calls
    'function-parameters': {
		pattern: /\((?:\b([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*)*\b([a-zA-Z_][a-zA-Z0-9_]*)\)/,
		alias: 'punctuation',
		greedy: true,
		lookbehind: true,
		inside: {
			'function-parameter': {
				pattern: /\b[a-zA-Z_][a-zA-Z0-9_]*/,
				alias: 'variable.parameter.function.mimo'  // Customize alias for parameters
			}
		}
	},
	
	// Highlights constant PI (can be extended for other constants)
	constant: {
		pattern: /\b(PI)\b/,
		alias: 'constant.mimo'
	},
	// Highlights variables (can be further categorized if needed)
	'indexed-variable': {
		pattern: /\b([a-zA-Z_][a-zA-Z0-9_]*)\b(?=\s*\[)/,
		alias: 'variable.other.indexed.mimo'
	},
	// Highlights control flow and built-in keywords
	keyword: /\b(if|else|endif|while|endwhile|function|endfunction|call|return|set|show|operate)\b/,
	// Highlights arithmetic operators
	operator: /[+\-*%><=]/,
	// Highlights numeric constants
	number: /\b\d+\b/,
	// Highlights strings with both single and double quotes
	string: [
		{
			pattern: /"(?:\\.|[^\\"])*"/,
			greedy: true
		},
		{
			pattern: /'(?:\\.|[^\\'])*'/,
			greedy: true
		}
	],
	// Highlights line comments
	'line-comment': /\/\/.*/,
	// Highlights block comments
	'block-comment': {
		pattern: /\/\*[\s\S]*?\*\//,
		greedy: true
	},
	// Highlights arrays with different patterns for strings and numbers within them
	array: {
		pattern: /\[(?:"(?:\\.|[^\\"])*"|'(?:\\.|[^\\'])*'|\d+)\]/,
		inside: {
			string: {
				pattern: /"(?:\\.|[^\\"])*"|'(?:\\.|[^\\'])*'/,
				greedy: true
			},
			number: /\d+/
		}
	}
};

export default Prism;
