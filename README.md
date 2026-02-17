
[![GitHub release](https://img.shields.io/github/release/bethropolis/mimo?include_prereleases=&sort=semver&color=blue)](https://github.com/bethropolis/mimo/releases/)
[![License](https://img.shields.io/badge/License-MIT-blue)](#license)
[![Deploy to GitHub Pages](https://github.com/bethropolis/mimo/actions/workflows/deploy.yml/badge.svg)](https://github.com/bethropolis/mimo/actions/workflows/deploy.yml)

a simple programming language written in js.

### Running Programs

```bash
# Execute a Mimo file
mimo path/to/program.mimo

# Evaluate a string directly
mimo -e "+ 1 2"

# Read from STDIN
echo "+ 1 2" | mimo
```

### Interactive REPL

```bash
# Start the REPL
mimo repl
```

## Instalation

```sh
# install globally
npm install -g mimo-lang

# install project scope
npm install mimo-lang

```

### Global cli commands

the following are available commands and flags for the cli tool.

```bash
$ mimo <command> [options]

# run a file
mimo path/to/program.mimo

# repl
mimo repl

# format .mimo files in a path
mimo fmt test/source --write

# check formatting
mimo fmt test/source --check

# lint .mimo files
mimo lint test/source

# fail CI on lint warnings
mimo lint test/source --fail-on-warning

# run test files
mimo test test/source
```

example `mimo exampleFile.mimo`

### Library usage

example:

```js
import Mimo from "../index.js";

let mimo = new Mimo();

let code = /* your code here*/

mimo.run(code);
```

## Language syntax:

```
function add(a,b)
  return + a b
end

set x 5
set y 2

call add(x,y) -> result
show result
```

more example in the `test/source/` directory.


## Developer workflows

```bash
# strict local checks
bun run check

# individual tooling commands
bun run lint:strict
bun run format:check
bun run test
```

## About
this is just a simple language i created to learn more about how programing languages work.
contributions are welcome.

## License
Released under [MIT](./LICENSE)

happy coding 💜
