import { LanguageSupport, StreamLanguage } from '@codemirror/language';
import { autocompletion, snippetCompletion } from '@codemirror/autocomplete';
import { search, searchKeymap } from '@codemirror/search';
import { keymap } from '@codemirror/view';

const numberPattern = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\b/;
const booleanPattern = /^(?:true|false)\b/;
const nullPattern = /^null\b/;
const keywordPattern = /^(?:if|elif|else|while|for|in|match|case|default|break|continue|try|catch|throw|return|function|call|end|import|export|from|as|show|destructure)\b/;
const variableKeywordPattern = /^(?:set|let|const|global)\b/;
const modulePattern = /^(?:array|string|math|json|fs|http|datetime|regex)\b/;
const builtinPattern = /^(?:len|get|update|type|push|pop|slice|range|join|has_property|keys|values|entries|get_arguments|get_env|exit_code|coalesce|get_property_safe|if_else)\b/;
const wordOperatorPattern = /^(?:and|or|not)\b/;
const symbolOperatorPattern = /^(?:\.\.\.|===|!==|==|!=|>=|<=|->|\?\.|\?:|\?\?|\+|\-|\*|\/|%|=|>|<|&&|\|\||!|\?|:)/;
const punctuationPattern = /^[()\[\]{},.]/;
const identifierPattern = /^[A-Za-z_][A-Za-z0-9_]*/;

const mimoStreamParser = {
	startState() {
		return { inTemplateString: false, templateDepth: 0 };
	},
	/** @param {import('@codemirror/language').StringStream} stream @param {any} state */
	token(stream, state) {
		if (stream.eatSpace()) return null;

		if (stream.match('//')) {
			stream.skipToEnd();
			return 'comment';
		}

		if (stream.peek() === '`') {
			stream.next();
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
				if (ch === '`') break;
				if (ch === '$' && stream.peek() === '{') {
					stream.backUp(1);
					return 'string';
				}
			}
			return 'string';
		}

		if (stream.peek() === '"') {
			stream.next();
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
		if (stream.match(nullPattern)) return 'atom';
		if (stream.match(keywordPattern)) return 'keyword';
		if (stream.match(variableKeywordPattern)) return 'keyword';
		if (stream.match(modulePattern)) return 'className';
		if (stream.match(builtinPattern)) return 'macro';
		if (stream.match(wordOperatorPattern)) return 'operator';
		if (stream.match(symbolOperatorPattern)) return 'operator';
		if (stream.match(punctuationPattern)) return 'punctuation';
		if (stream.match(identifierPattern)) return 'variableName';

		stream.next();
		return null;
	},
	languageData: {
		commentTokens: { line: '//' }
	}
};

export const mimoLanguage = new LanguageSupport(StreamLanguage.define(mimoStreamParser));

const completionKeywords = [
	'if', 'elif', 'else', 'while', 'for', 'in', 'match', 'case', 'default',
	'break', 'continue', 'try', 'catch', 'throw', 'return', 'function',
	'end', 'import', 'export', 'from', 'as', 'call', 'show', 'destructure'
];

const completionVariableKeywords = ['set', 'let', 'const', 'global'];

const completionOperators = ['+', '-', '*', '/', '%', '=', '>', '<', '>=', '<=', '!=', '==', 'and', 'or', 'not'];

const completionBuiltins = [
	'len', 'get', 'update', 'type', 'push', 'pop', 'slice', 'range', 'join',
	'has_property', 'keys', 'values', 'entries', 'get_arguments', 'get_env',
	'exit_code', 'coalesce', 'get_property_safe', 'if_else'
];

const completionModules = ['array', 'string', 'math', 'json', 'fs', 'http', 'datetime', 'regex'];

const arrayMethods = ['map', 'filter', 'reduce', 'for_each', 'find', 'find_index', 'includes', 'index_of', 'last_index_of', 'slice', 'first', 'last', 'is_empty', 'sort', 'reverse', 'shuffle', 'concat', 'unique', 'intersection', 'union', 'difference'];

const stringMethods = ['length', 'to_upper', 'to_lower', 'to_title_case', 'capitalize', 'trim', 'substring', 'slice', 'contains', 'starts_with', 'ends_with', 'index_of', 'replace', 'split', 'join'];

const mathMethods = ['abs', 'sqrt', 'pow', 'floor', 'ceil', 'round', 'sin', 'cos', 'tan', 'random', 'seed', 'randint'];

const mathConstants = ['PI', 'E'];

const mimoCompletionEntries = [
	...completionKeywords.map((label) => ({ label, type: 'keyword' })),
	...completionVariableKeywords.map((label) => ({ label, type: 'keyword' })),
	...completionOperators.map((label) => ({ label, type: 'operator' })),
	...completionBuiltins.map((label) => ({ label, type: 'function' })),
	...completionModules.map((label) => ({ label, type: 'namespace' })),
	...arrayMethods.map((label) => ({ label: `array.${label}`, type: 'function' })),
	...stringMethods.map((label) => ({ label: `string.${label}`, type: 'function' })),
	...mathMethods.map((label) => ({ label: `math.${label}`, type: 'function' })),
	...mathConstants.map((label) => ({ label: `math.${label}`, type: 'constant' })),

	snippetCompletion('function ${1:name}(${2:args})\n\t${3:body}\nend', {
		label: 'function … end',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('if ${1:condition}\n\t${2:body}\nend', {
		label: 'if … end',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('if ${1:condition}\n\t${2:body}\nelif ${3:condition}\n\t${4:body}\nelse\n\t${5:body}\nend', {
		label: 'if … elif … else … end',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('if ${1:condition}\n\t${2:body}\nelse\n\t${3:body}\nend', {
		label: 'if … else … end',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('while ${1:condition}\n\t${2:body}\nend', {
		label: 'while … end',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('for ${1:item} in ${2:list}\n\t${3:body}\nend', {
		label: 'for … in … end',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('for ${1:i} in range ${2:start} ${3:end}\n\t${4:body}\nend', {
		label: 'for … in range … end',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('match ${1:value}\n\tcase ${2:pattern}:\n\t\t${3:body}\n\tdefault:\n\t\t${4:body}\nend', {
		label: 'match … case … end',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('case ${1:pattern}:\n\t${2:body}', {
		label: 'case … :',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('default:\n\t${1:body}', {
		label: 'default:',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('try\n\t${1:body}\ncatch ${2:error}\n\t${3:handler}\nend', {
		label: 'try … catch … end',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('import ${1:module} from "${2:module}"', {
		label: 'import … from',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('import ${1:module} from "${2:module}" as ${3:alias}', {
		label: 'import … as',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('export { ${1:items} }', {
		label: 'export { … }',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('set ${1:name} ${2:value}', {
		label: 'set …',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('let ${1:name} ${2:value}', {
		label: 'let …',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('const ${1:NAME} ${2:value}', {
		label: 'const …',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('global ${1:name} ${2:value}', {
		label: 'global …',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('call ${1:function}(${2:args}) -> ${3:result}', {
		label: 'call … -> result',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('array.map ${1:arr} (fn ${2:x}, ${3:body})', {
		label: 'array.map …',
		type: 'function',
		detail: 'snippet'
	}),
	snippetCompletion('array.filter ${1:arr} (fn ${2:x}, ${3:condition})', {
		label: 'array.filter …',
		type: 'function',
		detail: 'snippet'
	}),
	snippetCompletion('return ${1:value}', {
		label: 'return …',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('show ${1:value}', {
		label: 'show …',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('throw "${1:message}"', {
		label: 'throw …',
		type: 'keyword',
		detail: 'snippet'
	}),
	snippetCompletion('[${1:items}]', {
		label: '[ … ] array',
		type: 'text',
		detail: 'snippet'
	}),
	snippetCompletion('{ ${1:key}: ${2:value} }', {
		label: '{ … } object',
		type: 'text',
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

export const mimoEditorExtensions = [
	autocompletion({ override: [mimoCompletionSource], activateOnTyping: true }),
	search({ top: true }),
	keymap.of(searchKeymap)
];
