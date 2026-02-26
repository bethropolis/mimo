/* PrismJS language definition for Mimo */
(function (Prism) {
	if (!Prism) return;

	var mimo = {
		comment: {
			pattern: /\/\/.*/,
			greedy: true
		},
		'template-string': {
			pattern: /`(?:\\[\\s\\S]|\$\{[^{}]*\}|[^\\`])*`/,
			greedy: true,
			inside: {
				interpolation: {
					pattern: /\$\{[^{}]*\}/,
					inside: {
						'interpolation-punctuation': {
							pattern: /^\$\{|\}$/,
							alias: 'punctuation'
						},
						rest: null
					}
				},
				string: /[\s\S]+/
			}
		},
		string: {
			pattern: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/,
			greedy: true
		},
		number: /\b-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?\b/,
		boolean: /\b(?:true|false)\b/,
		null: /\bnull\b/,
		decorator: {
			pattern: /@[A-Za-z_][A-Za-z0-9_]*/,
			alias: 'function'
		},
		keyword: /\b(?:if|then|elif|else|while|for|in|match|case|default|break|continue|try|catch|throw|return|function|fn|call|end|import|export|from|as|show|set|let|const|global|destructure|guard|when|with)\b/,
		module: /\b(?:array|string|math|json|fs|http|datetime|regex|object)\b/,
		'namespace-function': {
			pattern: /\b(?:array|string|math|json|fs|http|datetime|regex|object)\.[A-Za-z_][A-Za-z0-9_]*/,
			alias: 'builtin'
		},
		builtin: /\b(?:len|get|update|type|push|pop|slice|range|join|has_property|keys|values|entries|get_arguments|get_env|exit_code|coalesce|get_property_safe|if_else)\b/,
		function: /\b[A-Za-z_][A-Za-z0-9_]*(?=\s*\()/,
		operator: /\.\.\.|\b(?:and|or|not)\b|(?:===|!==|==|!=|>=|<=|->|\?\.|\?:|\?\?|\+|\-|\*|\/|%|=|>|<|&&|\|\||!|\?|:)/,
		property: {
			pattern: /\.[A-Za-z_][A-Za-z0-9_]*/,
			inside: {
				punctuation: /^\./
			}
		},
		'object-key': {
			pattern: /\b[A-Za-z_][A-Za-z0-9_]*(?=\s*:)/,
			alias: 'property'
		},
		punctuation: /[()[\]{},.]/
	};

	mimo['template-string'].inside.interpolation.inside.rest = mimo;
	Prism.languages.mimo = mimo;
	Prism.languages.mimoLang = mimo;
})(typeof Prism !== 'undefined' ? Prism : null);
