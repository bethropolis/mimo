import { LanguageSupport, StreamLanguage } from '@codemirror/language';

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
