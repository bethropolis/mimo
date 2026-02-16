# Mimo Programming Language

A modern, expression-oriented programming language with prefix notation syntax, built with JavaScript.

## Features

- **Prefix Notation**: Clean, unambiguous syntax with operators before operands
- **Expression-Oriented**: Everything is an expression that returns a value
- **Interactive REPL**: Full-featured Read-Eval-Print Loop for experimentation
- **Modular Design**: Well-organized codebase with clear separation of concerns
- **Strong Type System**: Built-in type checking and validation
- **Standard Library**: Comprehensive stdlib with math, string, and array operations
- **Module System**: Import/export functionality for code organization

## Quick Start

### Running Programs

```bash
# Execute a Mimo file
node index.js path/to/program.mimo

# Or use the CLI directly
node cli.js path/to/program.mimo
```

### Interactive REPL

```bash
# Start the REPL
node repl.js

# Or use the guided startup script
./start_repl.sh
```

### Basic Syntax Examples

```mimo
// Variables and expressions
set x 42
let y + x 8
show y  // Output: 50

// Functions
function greet(name)
    return + "Hello, " name
end

call greet("World") -> message
show message  // Output: Hello, World

// Arrays and operations
set numbers [1, 2, 3, 4, 5]
call len(numbers)  // Output: 5
numbers[0]         // Output: 1

// Objects
set person { name: "Alice", age: 30 }
person.name        // Output: Alice

// Control flow
if (> x 40)
    show "x is large"
else
    show "x is small"
end
```

## Project Structure

```
mimo-next/
├── adapters/           # Platform adapters (Node.js, browser)
├── cli.js             # Command-line interface
├── docs/              # Documentation and guides
├── index.js           # Main entry point
├── interpreter/       # Core interpreter components
│   ├── coreBuiltins.js       # Built-in functions
│   ├── BuiltinFunction.js    # Built-in function class
│   ├── executors/            # Statement executors
│   └── stdlib/               # Standard library modules
│       └── array/            # Modularized array functions
├── lexer/             # Lexical analysis
│   └── tokenizers/    # Token-specific lexers
├── parser/            # Syntax analysis
│   └── statements/    # Statement-specific parsers
├── repl.js            # Interactive REPL
├── test/              # Test files and suites
└── web.js             # Browser entry point
```

## Testing

### Core Language Tests

```bash
# Run basic functionality tests
node index.js test/source/all.mimo
node index.js test/source/builtins.mimo
node index.js test/source/stdlib_math.mimo
node index.js test/source/stdlib_string.mimo
node index.js test/source/stdlib_array.mimo
```

### REPL Tests

```bash
# Run all REPL tests
node test/run_repl_tests.js

# Run individual REPL tests
node test/test_repl.js           # Basic REPL functionality
node test/test_repl_advanced.js  # Advanced features
node test/test_multiline.js      # Multi-line input support
```

### Expression Parser Tests

```bash
# Test binary/unary minus operations
node index.js test/source/minus_operations_test.mimo
node index.js test/source/minus_edge_cases_test.mimo

# Test math utilities with fixed parser
node index.js test/source/math_utils.mimo
```

## Documentation

- **[REPL Guide](docs/repl-guide.md)** - Complete REPL usage and features
- **[Modularization Progress](docs/modularization-progress.md)** - Development history and refactoring details
- **[Demo Script](demo_repl.mimo)** - Example code for REPL exploration

## Development

### Architecture

The Mimo language follows a traditional interpreter architecture:

1. **Lexer** (`lexer/`) - Tokenizes source code
2. **Parser** (`parser/`) - Builds Abstract Syntax Tree (AST)
3. **Interpreter** (`interpreter/`) - Executes the AST
4. **REPL** (`repl.js`) - Interactive environment

### Key Design Decisions

- **Modular Components**: Each major component is separated for maintainability
- **Prefix Notation**: Eliminates operator precedence ambiguity
- **Expression-First**: Most constructs return values
- **Persistent REPL Environment**: Variables and functions persist across REPL sessions

### Recent Improvements

- ✅ **Parser Fix**: Binary minus operations now work correctly (`- a b`)
- ✅ **BuiltinFunctions Modularization**: Split into class and instances
- ✅ **Array Standard Library**: Categorized into logical modules
- ✅ **Interactive REPL**: Full-featured with multi-line support
- ✅ **Comprehensive Testing**: Automated test suites for all components

## Contributing

When making changes:

1. Run the core language tests to ensure functionality
2. Run REPL tests if modifying the interactive environment
3. Update documentation for new features
4. Follow the existing modular architecture patterns

## License

[Add license information here]