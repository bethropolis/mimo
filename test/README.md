# Mimo Test Suite

This directory contains all test files for the Mimo programming language interpreter and REPL.

## Test Categories

### Core Language Tests (`source/`)

Mimo source files (`.mimo`) that test core language functionality:

- **`all.mimo`** - Comprehensive test covering all major language features
- **`builtins.mimo`** - Built-in function testing
- **`stdlib_*.mimo`** - Standard library module tests (math, string, array)
- **`math_utils.mimo`** - Mathematical operations and parser fixes
- **`minus_operations_test.mimo`** - Binary/unary minus operation validation
- **`minus_edge_cases_test.mimo`** - Edge cases for minus operator parsing
- **Pattern matching, control flow, modules** - Various feature-specific tests

### REPL Tests

JavaScript test files for the interactive REPL:

- **`test_repl.js`** - Basic REPL functionality (expressions, variables, commands)
- **`test_repl_advanced.js`** - Advanced features (objects, arrays, complex expressions)
- **`test_multiline.js`** - Multi-line input support (functions, control structures)
- **`run_repl_tests.js`** - Test runner for all REPL tests

## Running Tests

### Core Language Tests

```bash
# Run individual language tests
bun index.js test/source/all.mimo
bun index.js test/source/builtins.mimo
bun index.js test/source/stdlib_math.mimo
bun index.js test/source/stdlib_string.mimo
bun index.js test/source/stdlib_array.mimo

# Test specific features
bun index.js test/source/math_utils.mimo
bun index.js test/source/minus_operations_test.mimo
bun index.js test/source/pattern_matching.mimo
```

### REPL Tests

```bash
# Run all REPL tests
bun test/run_repl_tests.js

# Run individual REPL tests
bun test/test_repl.js
bun test/test_repl_advanced.js
bun test/test_multiline.js
```

## Test Structure

### Language Test Files

Each `.mimo` test file demonstrates and validates specific language features:

```mimo
// Example test structure
show "=== Testing Feature X ==="
set test_var 42
call some_function(test_var) -> result
show "Expected result:", expected_value
show "Actual result:", result
// Assertions are implicit through successful execution
```

### REPL Test Files

REPL tests use bun.js child processes to interact with the REPL programmatically:

```javascript
const testCommands = [
    'set x 42',
    'x',           // Should output: 42
    'exit'
];
// Automated command sending and output validation
```

## Test Coverage

### Parser and Lexer
- ✅ All token types and operators
- ✅ Expression parsing (including fixed binary minus)
- ✅ Statement parsing
- ✅ Multi-line constructs
- ✅ Error handling and reporting

### Interpreter
- ✅ Variable scoping and assignment
- ✅ Function definitions and calls
- ✅ Control flow (if/else, loops, match)
- ✅ Built-in functions
- ✅ Standard library modules
- ✅ Module system (import/export)

### REPL
- ✅ Single-line expressions
- ✅ Multi-line input detection
- ✅ Variable persistence
- ✅ Function definitions
- ✅ Error handling
- ✅ Exit mechanisms

### Data Types and Operations
- ✅ Numbers, strings, booleans, null
- ✅ Arrays (creation, access, methods)
- ✅ Objects (creation, property access)
- ✅ Type checking and conversion

## Adding New Tests

### For Language Features

1. Create a new `.mimo` file in `test/source/`
2. Use descriptive names and comments
3. Test both success and error cases
4. Include show statements for visual validation

### For REPL Features

1. Add test commands to existing REPL test files
2. Or create new specialized test file
3. Update `run_repl_tests.js` if adding new test file
4. Ensure proper cleanup and exit handling

## Test Output

### Successful Tests
- Core language tests run silently on success
- REPL tests show "✅ PASSED" status
- Error-free execution indicates passing tests

### Failed Tests
- Parse errors show line/column information
- Runtime errors display stack traces
- REPL tests show "❌ FAILED" with error details

## Continuous Testing

Run the full test suite during development:

```bash
# Quick validation
echo 'show "Basic test"' | bun repl.js

# Full language test
bun index.js test/source/all.mimo

# Complete REPL validation
bun test/run_repl_tests.js
```