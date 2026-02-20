<p align="center">
  <img src="playground/src/lib/assets/mascot.png" alt="Mimo mascot" width="120">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/mimo-lang">
    <img src="https://img.shields.io/npm/v/mimo-lang?color=%23a855f7&label=npm&logo=npm" alt="npm version">
  </a>
  <a href="https://github.com/bethropolis/mimo/releases">
    <img src="https://img.shields.io/github/v/release/bethropolis/mimo?color=%236366f1&label=github&logo=github" alt="GitHub release">
  </a>
  <a href="https://github.com/bethropolis/mimo/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/bethropolis/mimo?color=%2310b981" alt="License">
  </a>
  <a href="https://bethropolis.github.io/mimo/">
    <img src="https://img.shields.io/badge/docs-online-%23f59e0b?logo=book" alt="Documentation">
  </a>
</p>

<p align="center">
  <strong>A minimal prefix-notation programming language</strong>
</p>

---

## Installation

```bash
bun install -g mimo-lang
```

## Usage

### Run Programs

```bash
mimo path/to/program.mimo
mimo -e "+ 1 2"
echo "+ 1 2" | mimo
```

### REPL

```bash
mimo repl
```

### CLI Commands

```bash
mimo run <file>           # Run a file
mimo repl                 # Start REPL
mimo fmt <path> --write   # Format files
mimo lint <path>          # Lint files
mimo test <path>          # Run tests
```

## Syntax

```mimo
function add(a, b)
  return + a b
end

call add(4, 8) -> result
show result
```

More examples in [`test/source/`](./test/source).

## Development

```bash
bun install
bun run check
```


## About
this is just a simple language i created to learn more about how programing languages work.
contributions are welcome.

## Links

- [Documentation](https://bethropolis.github.io/mimo/)
- [Playground](https://bethropolis.github.io/mimo/playground)
- [GitHub](https://github.com/bethropolis/mimo)

## License

Released under [MIT](./LICENSE)

<p align="center">happy coding 💜</p>
