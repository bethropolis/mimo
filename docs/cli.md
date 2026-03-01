# CLI Reference

The Mimo Language Toolkit is invoked via the `mimo` command (or `bun bin/cli.js` in the source tree).

```
mimo <command> [options]
mimo <file>
```

---

## Global Options

| Flag | Description |
|------|-------------|
| `--version`, `-v` | Print the version number and exit |
| `--help`, `-h` | Show global help |
| `--eval <code>`, `-e <code>` | Evaluate a string of Mimo code |
| `-` | Read and execute Mimo code from STDIN |

### Per-command help

Every command supports `--help`. Either of the following works:

```bash
mimo help <command>
mimo <command> --help
```

### Colored output

Output is colored automatically when stdout is a TTY. Set `NO_COLOR=1` to suppress ANSI codes unconditionally.

---

## Commands

### `run`

Execute a Mimo source file.

```bash
mimo run <file>
mimo <file>          # shorthand — file is run directly
```

Passing `-` or piping via STDIN also works:

```bash
echo 'show + 1 2' | mimo
mimo -
```

**Exit codes:** `0` on success, `1` on parse or runtime error.

---

### `repl`

Start the interactive Read-Eval-Print Loop.

```bash
mimo repl
```

The REPL supports multiline input, command history (`.mimo_history`), and special commands:

| Command | Description |
|---------|-------------|
| `:load <file>` | Load and evaluate a `.mimo` file |
| `:ast <expr>` | Print the AST for an expression |
| `:time <expr>` | Time the evaluation of an expression |
| `:save <file>` | Save session history to a file |

---

### `fmt`

Format `.mimo` source files using the canonical pretty-printer.

```bash
mimo fmt [options] [paths...]
echo "code" | mimo fmt
```

| Option | Description |
|--------|-------------|
| `--write` | Write formatted output back to files in place |
| `--check` | Exit with code `1` if any file is not already formatted (CI mode) |
| `--quiet` | Suppress all output except errors |
| `--verbose` | Show each file's status even when unchanged |

**Examples:**

```bash
# Preview formatting (does not modify files)
mimo fmt src/

# Format all files in place
mimo fmt --write src/

# CI check — fails if any file needs formatting
mimo fmt --check src/

# Format from STDIN
echo 'show + 1 2' | mimo fmt
```

**Notes:**
- Without `--write` or `--check`, `fmt` prints the formatted output to stdout (preview mode).
- The canonical indentation is **4 spaces**.
- The formatter is idempotent — running it twice produces the same result.

---

### `lint`

Statically analyse `.mimo` files for common issues.

```bash
mimo lint [options] [paths...]
```

| Option | Description |
|--------|-------------|
| `--fail-on-warning` | Exit `1` on warnings, not just errors |
| `--quiet` | Suppress per-file output; print only the summary line |
| `--verbose` | Show rule IDs alongside each diagnostic message |
| `--json` | Output results as JSON (useful for editor integrations) |
| `--rule:<name>=<bool>` | Override a specific rule on the command line |

**Available rules:**

| Rule | Default | Description |
|------|---------|-------------|
| `no-unused-vars` | on | Variables declared but never read |
| `prefer-const` | on | Variables that could be `const` |
| `no-magic-numbers` | off | Bare numeric literals outside declarations |
| `no-empty-function` | off | Functions with empty bodies |
| `max-depth` | off | Nesting depth exceeds threshold |
| `no-shadow` | off | Variable shadows an outer-scope binding |
| `consistent-return` | off | Inconsistent use of `return` in a function |

**Examples:**

```bash
mimo lint src/
mimo lint --fail-on-warning src/
mimo lint --rule:no-magic-numbers=true src/
mimo lint --json src/ | jq .
```

**Exit codes:** `0` if clean, `1` on errors (or warnings when `--fail-on-warning` is set).

---

### `test`

Discover and run `.mimo` test files, reporting pass/fail per file.

```bash
mimo test [options] [path]
```

| Option | Description |
|--------|-------------|
| `--quiet` | Print only the final summary line |
| `--verbose` | Show captured output even for passing tests |

**File discovery:** the runner picks up `.mimo` files that are inside a directory named `test`, or have `.test.` in their filename.

**Examples:**

```bash
# Run all tests discovered from the current directory
mimo test

# Run tests in a specific directory
mimo test test/source/

# Run a single test file
mimo test test/source/strings.mimo
```

**Exit codes:** `0` if all tests pass, `1` if any fail.

---

### `convert`

Transpile Mimo source to another language.

```bash
mimo convert --in <file> --out <file> --to <target>
```

| Option | Description |
|--------|-------------|
| `--in <file>` | Input `.mimo` file |
| `--out <file>` | Output file path |
| `--to <target>` | Target language: `javascript`, `python`, `alya` |

**Examples:**

```bash
mimo convert --in app.mimo --out app.js --to javascript
mimo convert --in app.mimo --out app.py --to python
```

---

### `doctor`

Validate the Mimo runtime environment and report any issues.

```bash
mimo doctor
```

Checks performed:

| Check | Description |
|-------|-------------|
| Adapter API | All required host-adapter methods are present |
| Bun runtime | Bun version is detectable |
| Filesystem access | Read/write works in the current directory |
| HTTP dependency | `curl` is installed (required by the `http` stdlib module) |
| Interpreter smoke test | Basic evaluation (`+ 1 2`) succeeds |
| Stdlib module registry | All built-in stdlib modules resolve correctly |

**Exit codes:** `0` (PASS), `0` (PASS WITH WARNINGS), `1` (FAILED).

---

### `help`

Show global help or per-command help.

```bash
mimo help
mimo help <command>
```

---

## `--eval` / `-e`

Evaluate a snippet of Mimo code directly on the command line without creating a file.

```bash
mimo -e "show + 1 2"
mimo --eval "set x 10 show * x x"
```

**Exit codes:** `0` on success, `1` on error.

---

## STDIN

Pipe Mimo code into the toolkit via STDIN. Equivalent to `mimo run`:

```bash
echo 'show "hello"' | mimo
cat program.mimo | mimo
mimo -
```
