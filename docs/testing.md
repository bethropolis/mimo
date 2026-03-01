# Testing & Debugging

## Testing Your Changes

### 1. Unit Testing Individual Components
```bash
# Test lexer
bun -e "
  const { Lexer } = require('./lexer/Lexer.js');
  const lexer = new Lexer('+ 1 2', 'test');
  console.log(lexer.nextToken());
"

# Test parser / evaluator
bun bin/cli.js -e "your code here"
bun bin/cli.js -e "set x 10 show x"
```

### 2. Running Test Suite
```bash
# All tests + strict lint (the full CI gate)
bun run check

# Tests only
mimo test test/source/
bun bin/cli.js test test/source/

# Single test file
mimo test test/source/all.mimo

# REPL tests
bun test/run_repl_tests.js
```

### 3. Manual REPL Testing
```bash
# Start REPL
mimo repl
# or: bun repl.js

# In REPL:
> set x 10
> show x
10
> function double(n) return * 2 n end
> show call double(5)
10

# REPL special commands
> :load test/source/stdlib_path_env.mimo
> :ast call path.join("a", "b")
> :time call path.join("a", "b")
> :save repl-session.mimo
```

### 4. Testing Error Handling
```bash
# Should show helpful error
bun bin/cli.js -e "undefined_variable"

# Should show parse error
bun bin/cli.js -e "set x"

# Should show runtime error
bun bin/cli.js -e "/ 10 0"
```

### 5. Environment Diagnostics
```bash
# Validate runtime/tooling setup
mimo doctor
# or: bun bin/cli.js doctor
```

### 6. Formatting and Linting
```bash
# Check formatting without modifying files
mimo fmt --check test/source/

# Format all test sources in place
mimo fmt --write test/source/

# Lint with strict mode (fail on warnings)
mimo lint --fail-on-warning test/source/all.mimo
```

---

## Debugging Tips for AI Agents

### 1. Enable Verbose Output
```javascript
// Add to code temporarily:
console.log('DEBUG:', JSON.stringify(node, null, 2));
console.log('Environment:', this.env.vars);
```

### 2. Use Pretty Printer
```javascript
import { PrettyPrinter } from './tools/format/Printer.js';

const printer = new PrettyPrinter();
console.log(printer.format(ast));
```

### 3. Trace Execution Path
```bash
# Add console.log at key points:
# - Lexer.nextToken() - see tokens
# - Parser.parseStatement() - see what's being parsed
# - Evaluator.evaluate() - see what's being executed
```

### 4. Check Token Stream
```javascript
// Quick token dump
const lexer = new Lexer(source);
const tokens = [];
let token;
while ((token = lexer.nextToken())) tokens.push(token);
console.log(tokens);
```

---

## Debugging Examples

### Example: Tracing `+ 1 2`

**Step 1: Lexing** (`lexer/Lexer.js`)
```javascript
// Input: "+ 1 2"
// Output tokens:
[
  { type: 'OPERATOR', value: '+', line: 1, column: 0 },
  { type: 'NUMBER', value: 1, line: 1, column: 2 },
  { type: 'NUMBER', value: 2, line: 1, column: 4 }
]
```

**Step 2: Parsing** (`parser/Parser.js`)
```javascript
// Parser sees OPERATOR token, calls parseExpression()
// Builds BinaryExpression node:
{
  type: 'BinaryExpression',
  operator: '+',
  left: { type: 'Literal', value: 1 },
  right: { type: 'Literal', value: 2 }
}
```

**Step 3: Evaluation** (`interpreter/ExpressionEvaluator.js`)
```javascript
// ExpressionEvaluator.evaluate() switches on node type
// For BinaryExpression, calls binaryExpressionEvaluator
// Evaluates left (1), right (2), applies operator (+)
// Returns: 3
```

### Example: Tracing Function Call `call add(5, 3)`

**Lexer Output:**
```javascript
[
  { type: 'IDENTIFIER', value: 'call' },
  { type: 'IDENTIFIER', value: 'add' },
  { type: 'NUMBER', value: 5 },
  { type: 'NUMBER', value: 3 }
]
```

**Parser Output:**
```javascript
{
  type: 'FunctionCall',
  name: 'add',
  arguments: [
    { type: 'Literal', value: 5 },
    { type: 'Literal', value: 3 }
  ]
}
```

**Interpreter Execution:**
```javascript
// 1. Look up 'add' in environment
// 2. Evaluate arguments: [5, 3]
// 3. Create new environment with parameters bound
// 4. Execute function body
// 5. Return result
```
