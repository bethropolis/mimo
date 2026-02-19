# Mimo Language Converters

This directory contains converters for transpiling Mimo source code to various target languages.

## Directory Structure

```
converters/
├── javascript/
│   ├── to_js.js          # JavaScript converter implementation
│   └── mimo_runtime.js   # JavaScript runtime library
├── python/
│   ├── to_py.js          # Python converter implementation
│   └── mimo_runtime.py   # Python runtime library
└── README.md            # This file
```

## Supported Languages

### JavaScript
- **Converter**: `javascript/to_js.js`
- **Runtime**: `javascript/mimo_runtime.js`
- **Extensions**: `.js`
- **Aliases**: `js`, `javascript`

### Python
- **Converter**: `python/to_py.js`
- **Runtime**: `python/mimo_runtime.py`
- **Extensions**: `.py`
- **Aliases**: `py`, `python`

## Adding New Languages

To add support for a new target language:

1. **Create directory structure**:
   ```bash
   mkdir tools/converters/<language>
   ```

2. **Create converter class**:
   ```javascript
   // tools/converters/<language>/to_<lang>.js
   export class MimoTo<Lang>Converter {
       constructor() {
           this.output = "";
           // Initialize converter state
       }
       
       convert(ast) {
           // Convert AST to target language
           this.visitNode(ast);
           return this.output;
       }
       
       visitNode(node) {
           // Implement AST visitor pattern
       }
       
       // Implement visitor methods for each AST node type
   }
   ```

3. **Create runtime library**:
   ```
   // tools/converters/<language>/mimo_runtime.<ext>
   // Implement Mimo built-ins and standard library for target language
   ```

4. **Register converter**:
   ```javascript
   // In tools/convert.js
   import { MimoTo<Lang>Converter } from './converters/<language>/to_<lang>.js';
   
   // In setupDefaultConverters()
   this.register('<lang>', '.<ext>', MimoTo<Lang>Converter, '<language>/mimo_runtime.<ext>');
   ```

## Converter Implementation Guidelines

### Converter Class Requirements

- **Constructor**: Initialize converter state
- **convert(ast)**: Main entry point, returns converted code
- **visitNode(node)**: Implement visitor pattern for AST traversal
- **visit<NodeType>(node)**: Implement visitor for each AST node type

### Runtime Library Requirements

- **Core built-ins**: `len`, `get`, `update`, `type`, `push`, `pop`, `range`, `join`, etc.
- **Standard library modules**: `fs`, `json`, `datetime`, `math`, `string`, `array`
- **Error handling**: Proper exception handling and error messages
- **Type system**: Implement Mimo's type semantics in target language

### Best Practices

- **Language idioms**: Use target language's conventions and best practices
- **Error handling**: Preserve Mimo's error semantics
- **Performance**: Optimize for target language's performance characteristics
- **Compatibility**: Ensure generated code runs on target language's common runtimes
- **Documentation**: Document language-specific features and limitations

## Testing

Test your converter with:

```bash
# Single file output
npm run convert -- --to <lang> --in test.mimo --out output.<ext>

# Directory output
npm run convert -- --to <lang> --in test.mimo --out output_dir/

# Auto-detection
npm run convert -- --in test.mimo --out output.<ext>
```

## Examples

### JavaScript Example
```bash
npm run convert -- --to js --in program.mimo --out program.js
npm run convert -- --in program.mimo --out program.js  # Auto-detect
```

### Python Example
```bash
npm run convert -- --to python --in program.mimo --out program.py
npm run convert -- --in program.mimo --out program.py  # Auto-detect
```
