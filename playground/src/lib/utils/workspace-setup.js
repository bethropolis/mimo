/**
 * Default workspace content for new users
 */

export const DEFAULT_FILE_CONTENTS = {
	'src/main.mimo': `import "../modules/math.mimo" as math

function bootstrap(name)
  set score call math.double(21)
  show + "hello, " name
  show + "score=" score
  return score
end

call bootstrap("developer") -> result
show result`,
	'src/app.mimo': `function greet(person)
  return + "Welcome " person
end

call greet("Mimo") -> banner
show banner`,
	'modules/math.mimo': `export function double(value)
  return * value 2
end

export function sum(a, b)
  return + a b
end`,
	'modules/strings.mimo': `export function loud(text)
  return + text "!"
end`
};

export const DEFAULT_TABS = [
	{ id: 'src/main.mimo', name: 'main.mimo', content: DEFAULT_FILE_CONTENTS['src/main.mimo'] },
	{ id: 'modules/math.mimo', name: 'math.mimo', content: DEFAULT_FILE_CONTENTS['modules/math.mimo'] }
];

export const DEFAULT_ACTIVE_TAB = 'src/main.mimo';
