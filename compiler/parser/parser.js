// Parser function
export function parse(tokens) {
	let index = 0;

	const parseExpression = () => {
		if (tokens[index].type === 'number') {
			return { type: 'literal', value: parseFloat(tokens[index++].value) };
		} else if (tokens[index].type === 'identifier') {
			return { type: 'variable', name: tokens[index++].value };
		} else if (tokens[index].type === '[') {
			index++; // Skip '['
			const elements = [];
			while (tokens[index].type !== ']') {
				elements.push(parseExpression());
				index++;
			}
			index++; // Skip ']'
			return { type: 'list', elements };
		}
	};

	const parseStatement = () => {
		const statement = { type: 'statement' };

		if (tokens[index].value === 'set') {
			index++;
			statement.type = 'assignment';
			statement.target = tokens[index++].value;
			statement.value = parseExpression();
		} else if (tokens[index].value === 'if') {
			index++;
			statement.type = 'if';
			statement.condition = parseExpression();
			statement.consequent = parseStatement();
			if (tokens[index].value === 'else') {
				index++;
				statement.alternate = parseStatement();
			}
			if (tokens[index].value === 'endif') {
				index++;
			}
		} else if (tokens[index].value === 'while') {
			index++;
			statement.type = 'while';
			statement.condition = parseExpression();
			statement.body = parseStatement();
			if (tokens[index].value === 'endwhile') {
				index++;
			}
		} else if (tokens[index].value === 'function') {
			index++;
			statement.type = 'function';
			statement.name = tokens[index++].value;
			statement.params = [];
			while (tokens[index].value !== 'endfunction') {
				statement.params.push(tokens[index++].value);
			}
			index++;
			statement.body = [];
			while (tokens[index].value !== 'end') {
				statement.body.push(parseStatement());
			}
			index++; // Skip 'end'
		} else if (tokens[index].value === 'call') {
			index++;
			statement.type = 'call';
			statement.name = tokens[index++].value;
			statement.args = [];
			while (tokens[index].value !== '->') {
				statement.args.push(parseExpression());
				if (tokens[index].value !== '->') {
					index++;
				}
			}
			index++;
			statement.target = tokens[index++].value;
		} else if (tokens[index].value === 'show') {
			index++;
			statement.type = 'print';
			statement.value = parseExpression();
		}

		return statement;
	};

	const program = [];
	while (index < tokens.length) {
		program.push(parseStatement());
	}

	return program;
}