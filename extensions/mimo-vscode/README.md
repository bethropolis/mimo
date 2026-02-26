# Mimo VS Code Extension

Language support for `.mimo` files.

## Features

- Language registration for `.mimo` files
- TextMate syntax highlighting for modern Mimo syntax:
  - Decorators: `@name`, `@name(args)`
  - Operators: `??`, `?.`, `|>`, `...`, `->`
  - Keywords: `guard`, `when`, `with`, `then`
- Comment/bracket/autoclose configuration
- Run command: `Mimo: Run Current File`

## Quick Start

```bash
cd extensions/mimo-vscode

# validate manifest + smoke tests
bun run check

# create a local VSIX package
bun run package
```

## Test in VS Code

- Open `extensions/mimo-vscode/` in VS Code.
- Press `F5` and select `Run Mimo Extension`.
- In the Extension Development Host, open a `.mimo` file and run `Mimo: Run Current File`.

## Scripts

- `bun run validate`: validates extension manifest and required files.
- `bun run test`: runs smoke tests (including grammar regex validation).
- `bun run check`: runs validate + smoke tests.
- `bun run package`: runs check and builds `.vsix`.
- `bun run package:dry`: runs check and builds `mimo-vscode-dry.vsix`.
