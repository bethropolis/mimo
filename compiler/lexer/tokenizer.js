export function tokenize(input) {
	const tokens = [];
	let currentToken = '';
	let currentType = null;

	for (const char of input) {
		if (/\s/.test(char)) {
			if (currentType) {
				tokens.push({ type: currentType, value: currentToken.trim() });
				currentToken = '';
				currentType = null;
			}
		} else if (['+', '-', '*', '/', '(', ')', ',', '[', ']'].includes(char)) {
			if (currentToken) {
				tokens.push({ type: currentType, value: currentToken.trim() });
				currentToken = '';
				currentType = null;
			}
			tokens.push({ type: char, value: char });
		} else {
			currentToken += char;
			if (!currentType) {
				currentType = /[a-zA-Z]/.test(char) ? 'identifier' : /[0-9]/.test(char) ? 'number' : 'operator';
			}
		}
	}

	if (currentToken) {
		tokens.push({ type: currentType, value: currentToken.trim() });
	}

	return tokens;
}
