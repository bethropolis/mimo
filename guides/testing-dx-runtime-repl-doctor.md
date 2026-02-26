# Testing Guide: Path/Env + Stack Frames + REPL Commands + Doctor

This guide verifies the recently added:
- `path` stdlib module
- `env` stdlib module
- runtime stack traces with source frames
- REPL commands (`:load`, `:save`, `:time`, `:ast`)
- CLI `doctor` command

## 1) Baseline

Run a quick interpreter smoke check:

```bash
bun bin/cli.js -e "show + 1 2"
```

Expected output:
- `3`

## 2) Path + Env Stdlib

Run the dedicated test file:

```bash
bun bin/cli.js test/source/stdlib_path_env.mimo
```

Expected output includes:
- `src/lib/main.mimo`
- `/tmp`
- `file.txt`
- `.txt`
- `false`
- `fallback`
- `object` type for `env.all()`

Optional direct check:

```bash
bun bin/cli.js -e $'import path from "path"\nimport env from "env"\nshow call path.basename("/tmp/a.txt")\nshow call env.get("__MIMO_MISSING_VAR__", "fallback")'
```

Expected:
- `a.txt`
- `fallback`

## 3) Runtime Stack Traces with Source Frames

Create a failing file:

```bash
cat > /tmp/mimo_stack_demo.mimo << 'EOF'
function inner()
  return + 1 missing_var
end

function outer()
  return call inner()
end

call outer()
EOF
```

Run it:

```bash
bun bin/cli.js /tmp/mimo_stack_demo.mimo
```

Expected:
- Runtime error for undefined variable
- `Mimo Stack:` section
- stack frames for `<root>`, `outer`, and `inner`
- each frame includes source snippet + caret

## 4) REPL Commands

Start REPL:

```bash
bun repl.js
```

Inside REPL, run:

```text
:help
:ast call path.join("a", "b")
:time + 1 2
set x 42
:save /tmp/mimo_repl_saved.mimo
:load /tmp/mimo_repl_saved.mimo
:exit
```

Expected:
- `:help` lists the new commands
- `:ast` prints JSON AST
- `:time` prints elapsed ms
- `:save` confirms saved count
- `:load` replays saved code without parse errors

## 5) CLI Doctor

Run:

```bash
bun bin/cli.js doctor
```

Expected:
- report table with PASS/WARN/FAIL lines
- checks for adapter API, Bun runtime, filesystem, curl, interpreter smoke test, stdlib module registry
- final line: `Doctor result: PASS` (or `PASS WITH WARNINGS`)

## 6) Tooling Validation

VS Code extension grammar/snippets:

```bash
cd extensions/mimo-vscode
bun run check
cd ../..
```

Expected:
- `validate: ok`
- `smoke-test: ok`

## 7) Combined Regression Smoke

```bash
bun test/run_repl_tests.js
bun bin/cli.js lint test/source/stdlib_path_env.mimo
bun bin/cli.js fmt test/source/stdlib_path_env.mimo --check
```

Expected:
- REPL suite passes
- lint passes
- format check passes

