
export function createFunction(params, body, env) {
	return function(...args) {
		const newEnv = { ...env };
		params.forEach((param, index) => {
			newEnv[param] = args[index];
		});
		interpret(body, newEnv); // Interpret the body of the function
	};
}
