# Mimo Syntax Guide

A complete reference for the Mimo programming language.

---

## Introduction

Mimo is a dynamically-typed, interpreted programming language that uses **Polish notation** (prefix notation) for all operations. This means operators and functions come before their arguments, enabling a consistent and parentheses-light syntax.

### Hello World

```mimo
show "Hello, World!"
```

### Key Features

- **Polish Notation**: Operators and functions precede their arguments
- **Dynamic Typing**: Types are checked at runtime
- **First-class Functions**: Functions are values that can be passed around
- **Pattern Matching**: Powerful structural matching
- **Modern Flow Tools**: `|>` pipes, `guard`, optional chaining `?.`, and `??`
- **Module System**: Import and export functionality
- **Embedded-first**: Designed to be embedded in host applications

---

## Documentation Sections

| Section | Description |
|---------|-------------|
| [Variables and Constants](syntax/variables.md) | `set`, `let`, `const`, `global` and scoping |
| [Data Types](syntax/data-types.md) | Numbers, strings, booleans, null, arrays, objects |
| [Operators](syntax/operators.md) | Arithmetic, comparison, logical operators |
| [Control Flow](syntax/control-flow.md) | `if`, `while`, `for`, `break`, `continue` |
| [Functions](syntax/functions.md) | Functions, parameters, returns, closures |
| [Collections](syntax/collections.md) | Arrays, objects, and iteration |
| [Pattern Matching](syntax/pattern-matching.md) | `match`, `case`, destructuring |
| [Modules](syntax/modules.md) | `import`, `export`, standard library modules |
| [Error Handling](syntax/error-handling.md) | `try`, `catch`, `throw` |
| [Standard Library](syntax/stdlib.md) | Built-in functions and modules |
| [Style Guide](syntax/style-guide.md) | Naming conventions, formatting best practices |

---

## Basic Concepts

### Program Structure

A Mimo program is a sequence of statements executed top-to-bottom.

```mimo
// This is a simple program
show "Starting program"
set x 10
show x
show "Program complete"
```

### Statement vs Expression

- **Statement**: Performs an action (e.g., `show`, `set`, `if`)
- **Expression**: Produces a value (e.g., `+ 1 2`, `* x y`, function calls)

```mimo
// Statement
show "Hello"

// Expression (produces a value)
+ 5 3

// Expression used in statement
set result + 5 3
```

---

## Polish Notation

Polish notation (prefix notation) places the operator **before** its operands:

| Infix (Traditional) | Polish (Mimo) |
|---------------------|---------------|
| `2 + 3`            | `+ 2 3`       |
| `5 * 4`            | `* 5 4`       |
| `10 - 6`           | `- 10 6`      |
| `(2 + 3) * 4`      | `* (+ 2 3) 4` |

### Why Polish Notation?

1. **No operator precedence ambiguity**: Order is always explicit
2. **Fewer parentheses needed**: Only for grouping, not precedence
3. **Consistent syntax**: All operations follow the same pattern
4. **Natural for prefix operations**: Aligns with function call syntax

### Reading Polish Notation

Read from left to right, where each operator takes the next N arguments:

```mimo
// + takes 2 arguments: 5 and 3
+ 5 3
// Result: 8

// * takes 2 arguments: (+ 2 3) and 4
* (+ 2 3) 4
// Result: 20

// Deeply nested
+ * 2 3 / 8 4
// Read as: + (* 2 3) (/ 8 4) = 6 + 2 = 8
```

---

## Comments

Comments start with `//` and continue to the end of the line:

```mimo
// This is a comment
show "Hello"  // This is also a comment

// Multi-line comments use // on each line
// This is the second line
```

---

## Quick Reference Card

### Variables
```mimo
set x 10          // Mutable variable
let x 10          // Block-scoped variable
const PI 3.14     // Constant
global count 0    // Global variable
```

### Operators
```mimo
+ 5 3             // Addition (8)
- 10 4            // Subtraction (6)
* 7 6             // Multiplication (42)
/ 15 3            // Division (5)
% 10 3            // Modulo (1)
= 5 5             // Equal (true)
!= 3 4            // Not equal (true)
> 10 5            // Greater than (true)
< 3 7             // Less than (true)
and true false    // Logical AND (false)
or true false     // Logical OR (true)
not true          // Logical NOT (false)
```

### Control Flow
```mimo
if condition
    // code
elif other
    // code
else
    // code
end

while condition
    // code
end

for item in list
    // code
end

match value
    case x: code
end
```

### Functions
```mimo
function name(x)
    return x
end

call name(arg) -> result
set value if > n 0 then "pos" else "neg"
set [x, y] [10, 20]
set safe_name user?.profile?.name

set fn function(x)
    return x
end
```

### Collections
```mimo
[1, 2, 3]          // Array
{ a: 1, b: 2 }     // Object
arr[0]             // Array access
obj.prop           // Property access
```

### Modules
```mimo
import mod from "mod"
export { func1, func2 }
```

---

## Tips for Success

1. **Think prefix**: Always put the operation first
2. **Use parentheses**: When in doubt, add parentheses for clarity
3. **Start simple**: Master basic operations before complex nesting
4. **Read left-to-right**: Evaluate expressions from left to right
5. **Practice**: The notation becomes natural with use

---

## Common Pitfalls

### Incorrect Nesting
```mimo
// Wrong: Missing parentheses
set x + 2 * 3 4  // This is (+ 2 (* 3 4)) = 14

// Correct: Use parentheses for clarity
set x * (+ 2 3) 4  // This is (* (+ 2 3) 4) = 20
```

### Wrong Argument Order
```mimo
// Wrong: Arguments in wrong order
set result - 3 10  // 3 - 10 = -7

// Correct: First arg minus second arg
set result - 10 3  // 10 - 3 = 7
```

### Missing Return
```mimo
// Wrong: No return statement
function square(x)
    * x x  // Result is lost
end

// Correct: Explicit return
function square(x)
    return * x x
end
```
