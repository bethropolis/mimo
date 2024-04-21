# mimo

[![GitHub release](https://img.shields.io/github/release/bethropolis/mimo?include_prereleases=&sort=semver&color=blue)](https://github.com/bethropolis/mimo/releases/)
[![License](https://img.shields.io/badge/License-MIT-blue)](#license)
[![Deploy to GitHub Pages](https://github.com/bethropolis/mimo/actions/workflows/deploy.yml/badge.svg)](https://github.com/bethropolis/mimo/actions/workflows/deploy.yml)

a simple programming language written in js.

## Instalation

```sh
# install globally
npm install -g mimo-lang

# install project scope
npm install mimo-lang

```

### Global cli commands

the folowing are available commands and flags for the cli tool.

```bash
$ mimo [FILENAME] [-o|--output] [-t|--time] [-h|--help] [-q|--quiet] [-d|--debug] [-v|--version]
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
endfunction

set x 5
set y 2

call add(x,y) -> result
show result
```

more example in the [test directory]('./test/mimo/')


## Docs
check out the [documentation](./docs.md) file for more info.

## About
this is just a simple language i created to learn more about how programing languages work.
contributions are welcome.

## License
Released under [MIT](./LICENSE)

happy coding 💜
