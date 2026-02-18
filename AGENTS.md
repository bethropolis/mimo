# Guide for AI Agents

Welcome! This guide helps you navigate and understand the Mimo codebase efficiently. As an AI agent, you can leverage the CLI, REPL, and test suite to rapidly experiment and verify changes.

---

## Quick Start for AI Agents

### Verify Your Changes Instantly
```bash
# 1. Test a quick expression
bun bin/cli.js -e "show + 1 2"

# 2. Run a file
echo 'show "Hello from Mimo"' > temp.mimo
bun bin/cli.js temp.mimo

# 3. Start REPL for interactive testing
bun repl.js

# 4. Run the test suite
bun test.js

# 5. Lint and format
bun bin/cli.js lint test/source/all.mimo
bun bin/cli.js fmt test/source/all.mimo --check
```

### Common AI Agent Workflows
```bash
# Workflow 1: Test a new feature
echo "your test code" | bun bin/cli.js
bun test.js  # Ensure no regressions

# Workflow 2: Debug parser issues
bun bin/cli.js -e "your expression" 2>&1 | head -20

# Workflow 3: Test standard library changes
bun bin/cli.js -e "import math from 'math' \n show call math.sqrt 16"

# Workflow 4: Validate syntax changes
echo "function test() return 42 end" | bun bin/cli.js
```

---

## Mimo Philosophy
Mimo is a minimal, prefix-notation (Polish notation) programming language. It prioritizes simplicity, embeddability, and a consistent syntax where operators always precede their operands.

## Project Structure Overview
- **`lexer/`**: Contains [`Lexer.js`](lexer/Lexer.js), responsible for tokenizing source code using regular expressions.
- **`parser/`**: Contains [`Parser.js`](parser/Parser.js), an LL(k) recursive descent parser that generates an Abstract Syntax Tree (AST).
- **`interpreter/`**: The core execution engine.
    - [`Evaluator.js`](interpreter/Evaluator.js): A recursive tree-walker that evaluates AST nodes.
    - [`environment.js`](interpreter/environment.js): Manages variable storage and lexical scoping.
    - [`Utils.js`](interpreter/Utils.js): Utility functions like truthiness check and stringification.
- **`bin/`**: Contains [`cli.js`](bin/cli.js), the main entry point for CLI operations.
- **`repl.js`**: The interactive REPL implementation with multiline tracking and history.
- **`docs/`**: Public documentation, including the [Syntax Guide](docs/syntax-guide.md).
- **`playground/`**: A SvelteKit-based web playground for Mimo.
- **`extensions/mimo-vscode/`**: VS Code extension providing syntax highlighting and execution support.
- **`tools/`**: Internal tools for formatting, linting, and REPL enhancements.
- **`adapters/`**: Bridging Mimo to host environments (e.g., [`nodeAdapter.js`](adapters/nodeAdapter.js)).


---


## Execution Flow: Source to Result

### The Pipeline
```
Source Code
    ↓
┌─────────────┐
│   Lexer     │  → Breaks source into tokens
└─────────────┘
    ↓
  Tokens (array)
    ↓
┌─────────────┐
│   Parser    │  → Builds Abstract Syntax Tree
└─────────────┘
    ↓
  AST (tree structure)
    ↓
┌─────────────┐
│ Interpreter │  → Evaluates/executes AST
└─────────────┘
    ↓
  Result
```



## Key Files for Common Tasks

### Adding a New Operator
1. **Add token type** → `lexer/TokenTypes.js`
2. **Add to lexer** → `lexer/tokenizers/symbolTokenizer.js`
3. **Parse it** → `parser/expressions/operatorExpressions.js`
4. **Evaluate it** → `interpreter/evaluators/binaryExpressionEvaluator.js`
5. **Test it** → Add to `test/source/all.mimo`

### Adding a Built-in Function
1. **Define function** → `interpreter/coreBuiltins.js` or `interpreter/stdlib/`
2. **Export it** → Add to exports in the module
3. **Test it** → `bun bin/cli.js -e "show call your-function args"`

### Adding a Statement Type
1. **Add token** → `lexer/TokenTypes.js`
2. **Parse it** → `parser/statements/` (new file or existing)
3. **Execute it** → `interpreter/executors/` (new file or existing)
4. **Update dispatcher** → `interpreter/StatementExecutor.js`

### Adding a Standard Library Module
1. **Create module** → `interpreter/stdlib/yourmodule.js`
2. **Export functions** → Use `BuiltinFunction` wrapper
3. **Register module** → Add to module resolution in `ModuleLoader.js`
4. **Document it** → Add tests in `test/source/` and document in `docs/`.





## AI Agent Power Usage: CLI & REPL
As an AI agent, you can leverage the CLI for rapid experimentation and verification.

### Running Code on the Fly
Use the `--eval` or `-e` flag to execute Mimo code without creating files:
```bash
# Basic evaluation
bun bin/cli.js -e "+ 1 2"

# Complex evaluation with built-ins
bun bin/cli.js -e "show call math.sqrt(16)"
```

### Piping and STDIN
Redirect or pipe code into the CLI or REPL:
```bash
# Pipe code into CLI
echo "set x 10 \n show * x 2" | bun bin/cli.js

# Pipe code into REPL (automatically enables silent mode)
echo "function f(x) return * x 2 end \n show call f(10)" | bun repl.js
```


## Core Component Deep Dive

### Lexer & Parser
Mimo uses a classic pipeline: `Source -> Tokens -> AST`.
- For grammar changes, start in [`Lexer.js`](lexer/Lexer.js) for new token types.
- Update [`Parser.js`](parser/Parser.js) to handle new statement or expression structures.

### The Interpreter
The `Evaluator` is the heart of Mimo. It iterates through AST nodes and performs actions based on node type.
- **Binary Expressions**: Handled in `Evaluator.js` using `nodeAdapter` for basic ops.
- **Function Calls**: Scoping is handled by pushing/popping `Environment` instances.

## Tooling & Verification
- **Formatting**: `bun bin/cli.js fmt <path> --write`
- **Linting**: `bun bin/cli.js lint <path>`
- **Testing**:
    - Project tests: `bun test.js`
    - REPL tests: `bun test/run_repl_tests.js`
    - Language features: `test/source/` contains various `.mimo` files.

## Testing
to learn about testing, read the following files:
- `docs/testing.md`
- `test/README.md`


## Ecosystem
### Playground (`playground/`)
A web-based interactive editor. 
it consist of two pages: 
1. landing page: `playground/src/routes/+page.svelte`
2. playground page: `playground/src/routes/playground/+page.svelte`

writen using sveltekit (svelte 5) and tailwindcss v4.

### VS Code Extension (`extensions/mimo-vscode/`)
Provides syntax highlighting, snippets, and "Run" support.
- **Packaging**: `cd extensions/mimo-vscode && bun run package`
- **Grammar**: [`syntaxes/mimo.tmLanguage.json`](extensions/mimo-vscode/syntaxes/mimo.tmLanguage.json)



Refer to [docs/syntax-guide.md](docs/syntax-guide.md) for language reference.
Happy coding!
