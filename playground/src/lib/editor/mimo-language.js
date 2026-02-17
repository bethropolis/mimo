import { LanguageSupport, StreamLanguage } from '@codemirror/language';
import { autocompletion, snippetCompletion } from '@codemirror/autocomplete';

const numberPattern = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\b/;
const booleanPattern = /^(?:true|false|null)\b/;
const keywordPattern = /^(?:if|else|while|for|in|match|case|default|break|continue|try|catch|throw|return|function|fn|end|import|export|from|as)\b/;
const builtinPattern = /^(?:show|call)\b/;
const variableKeywordPattern = /^(?:set|let|const|global)\b/;
const supportClassPattern = /^(?:Math|String|Array|Datetime|JSON|Fs|Http)\b/;
const wordOperatorPattern = /^(?:and|or|not)\b/;
const symbolOperatorPattern = /^(?:===|!==|==|!=|>=|<=|\?\.|\?\?|\+|\-|\*|\/|%|=|>|<|&&|\|\||!|\?|:)/;
const punctuationPattern = /^[()\[\]{},]/;
const identifierPattern = /^[A-Za-z_][A-Za-z0-9_]*/;

const mimoStreamParser = {
	startState() {
		return {};
	},
	/** @param {import('@codemirror/language').StringStream} stream */
	token(stream) {
		if (stream.eatSpace()) return null;

		if (stream.peek() === '#') {
			stream.skipToEnd();
			return 'comment';
		}

		if (stream.match('"')) {
			let escaped = false;
			while (!stream.eol()) {
				const ch = stream.next();
				if (escaped) {
					escaped = false;
					continue;
				}
				if (ch === '\\') {
					escaped = true;
					continue;
				}
				if (ch === '"') break;
			}
			return 'string';
		}

		if (stream.match(numberPattern)) return 'number';
		if (stream.match(booleanPattern)) return 'atom';
		if (stream.match(keywordPattern)) return 'keyword';
		if (stream.match(builtinPattern)) return 'macro';
		if (stream.match(variableKeywordPattern)) return 'keyword';
		if (stream.match(wordOperatorPattern)) return 'operator';
		if (stream.match(symbolOperatorPattern)) return 'operator';
		if (stream.match(punctuationPattern)) return 'punctuation';
		if (stream.match(supportClassPattern)) return 'className';
		if (stream.match(identifierPattern)) return 'variableName';

		stream.next();
		return null;
	},
	languageData: {
		commentTokens: { line: '#' }
	}
};

export const mimoLanguage = new LanguageSupport(StreamLanguage.define(mimoStreamParser));

const completionKeywords = [
	'if',
	'else',
	'while',
	'for',
	'in',
	'match',
	'case',
	'default',
	'break',
	'continue',
	'try',
	'catch',
	'throw',
	'return',
	'function',
	'fn',
	'end',
	'import',
	'export',
	'from',
	'as',
	'set',
	'let',
	'const',
	'global',
	'call',
	'show'
];

const completionOperators = ['+', '-', '*', '/', '%', '=', '>', '<', '>=', '<=', '!=', '==', 'and', 'or', 'not'];
const completionBuiltins = ['array.length', 'array.sum', 'array.map', 'get', 'set'];

const mimoCompletionEntries = [
	...completionKeywords.map((label) => ({ label, type: 'keyword' })),
	...completionOperators.map((label) => ({ label, type: 'operator' })),
	...completionBuiltins.map((label) => ({ label, type: 'function' })),
	snippetCompletion('function ${1:name}(${2:arg})\n\t${3:show "todo"}\nend', {
		label: 'function … end',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('if ${1:condition}\n\t${2:show "true"}\nend', {
		label: 'if … end',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('if ${1:condition}\n\t${2:show "true"}\nelse\n\t${3:show "false"}\nend', {
		label: 'if … else … end',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('while ${1:condition}\n\t${2:show "loop"}\nend', {
		label: 'while … end',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('for ${1:item} in ${2:items}\n\t${3:show item}\nend', {
		label: 'for … in … end',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('match ${1:value}\n\tcase ${2:pattern}\n\t\t${3:show "matched"}\n\tdefault\n\t\t${4:show "default"}\nend', {
		label: 'match … case … end',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('try\n\t${1:call risky()}\ncatch ${2:error}\n\t${3:show error}\nend', {
		label: 'try … catch … end',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('import "${1:modules/math.mimo}" as ${2:math}', {
		label: 'import module as',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('export function ${1:name}(${2:arg})\n\t${3:return arg}\nend', {
		label: 'export function',
		type: 'keyword',
		detail: 'snippet'
	})
];

/** @param {import('@codemirror/autocomplete').CompletionContext} context */
function mimoCompletionSource(context) {
	const before = context.matchBefore(/[A-Za-z_+\-*/%<>=!][A-Za-z0-9_.+\-*/%<>=!]*/);
	if (!before && !context.explicit) return null;
	const from = before ? before.from : context.pos;
	return {
		from,
		options: mimoCompletionEntries,
		validFor: /^[A-Za-z0-9_.+\-*/%<>=!]*$/
	};
}

export const mimoEditorExtensions = [autocompletion({ override: [mimoCompletionSource], activateOnTyping: true })];
