# Modules

## Importing Modules

```mimo
// Import entire module
import math from "math"

// Use module
set result call math.sqrt 16
show result  // 4

// Import with alias
import math from "math" as m
set result call m.sqrt 9
show result  // 3

// Import module file
import mymodule from "./mymodule.mimo"
```

## Exporting from Modules

```mimo
// mymodule.mimo

// Export function
function add(a, b)
    return + a b
end

function multiply(a, b)
    return * a b
end

// Export variables
const PI 3.14159

// Make exports available
export { add, multiply, PI }
```

## Standard Library Modules

```mimo
// Array operations
import array from "array"

// String operations
import string from "string"

// Math functions
import math from "math"

// File system (Node.js only)
import fs from "fs"

// HTTP requests
import http from "http"

// JSON parsing
import json from "json"

// Regular expressions
import regex from "regex"

// Date and time
import datetime from "datetime"
```
