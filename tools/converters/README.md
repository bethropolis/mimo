# Mimo Language Converters

This directory contains converters for transpiling Mimo source code to various target languages.

## Modular Plugin System

The Mimo converter uses a modular plugin system. Each language support is contained within its own directory under `tools/converters/`.

### Directory Structure

```
converters/
├── base_converter.js     # Base class for all converters
├── javascript/
│   ├── index.js          # Plugin entry point (config + class)
│   ├── to_js.js          # JavaScript implementation
│   └── mimo_runtime.js   # JavaScript runtime
├── python/
│   ├── index.js          # Plugin entry point
│   ├── to_py.js          # Python implementation
│   └── mimo_runtime.py   # Python runtime
└── README.md
```

## Adding a New Language

To add support for a new target language, you only need to create a new directory with an `index.js` file.

1. **Create the directory**: `mkdir tools/converters/mylang`
2. **Create the implementation**: Create `to_mylang.js` (extending `BaseConverter`)
3. **Create the entry point**: Create `index.js` in your new directory:

```javascript
import { MyConverter } from './to_mylang.js';

export const config = {
    name: 'mylang',           // Main name
    aliases: ['ml', 'my'],    // Optional aliases
    extension: '.ml',         // Target file extension
    runtimeFile: 'runtime.ml' // Optional runtime file to copy
};

export { MyConverter as Converter };
```

The `tools/convert.js` script will automatically discover and register your new language on the next run.

## Supported Languages

### JavaScript
- **Extensions**: `.js`
- **Aliases**: `js`, `javascript`

### Python
- **Extensions**: `.py`
- **Aliases**: `py`, `python`

## Testing

```bash
# Auto-detect language from extension
node tools/convert.js --in program.mimo --out program.js

# Explicitly specify language
node tools/convert.js --in program.mimo --out output_dir/ --to python
```
