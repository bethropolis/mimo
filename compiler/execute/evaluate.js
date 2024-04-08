const evaluate = (expression, env) =>
	expression.type === 'literal' ? expression.value :
	expression.type === 'variable' ? env[expression.name] :
	expression.type === 'list' ? expression.elements.map(element => evaluate(element, env)) :
	null;