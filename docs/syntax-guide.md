# Mimo Syntax Guide
## A complete reference for the Mimo programming language

---

## Table of Contents

1. [Introduction](#introduction)
2. [Basic Concepts](#basic-concepts)
3. [Polish Notation](#polish-notation)
4. [Comments](#comments)
5. [Variables and Constants](#variables-and-constants)
6. [Data Types](#data-types)
7. [Operators](#operators)
8. [Control Flow](#control-flow)
9. [Functions](#functions)
10. [Collections](#collections)
11. [Pattern Matching](#pattern-matching)
12. [Modules](#modules)
13. [Error Handling](#error-handling)
14. [Standard Library](#standard-library)
15. [Style Guide](#style-guide)

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
- **Module System**: Import and export functionality
- **Embedded-first**: Designed to be embedded in host applications

---

## Basic Concepts

### Program Structure

A Mimo program is a sequence of statements executed top-to-bottom.

```mimo
# This is a simple program
show "Starting program"
set x 10
show x
show "Program complete"
```

### Statement vs Expression

- **Statement**: Performs an action (e.g., `show`, `set`, `if`)
- **Expression**: Produces a value (e.g., `+ 1 2`, `* x y`, function calls)

```mimo
# Statement
show "Hello"

# Expression (produces a value)
+ 5 3

# Expression used in statement
set result + 5 3
```

---

## Polish Notation

### What is Polish Notation?

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
# + takes 2 arguments: 5 and 3
+ 5 3
# Result: 8

# * takes 2 arguments: (+ 2 3) and 4
# First evaluate (+ 2 3) = 5
# Then evaluate * 5 4 = 20
* (+ 2 3) 4
# Result: 20

# Deeply nested
+ * 2 3 / 8 4
# Read as: + (* 2 3) (/ 8 4)
# Evaluate: + 6 2
# Result: 8
```

### Grouping with Parentheses

Use parentheses to change evaluation order or make intent clear:

```mimo
# Without parentheses (left-to-right evaluation)
+ * 2 3 4
# Evaluates as: + (* 2 3) 4 = 6 + 4 = 10

# With parentheses (explicit grouping)
* 2 (+ 3 4)
# Evaluates as: * 2 7 = 14

# Complex expression
* (+ 1 2) (+ 3 4)
# Evaluates as: * 3 7 = 21
```

---

## Comments

### Single-line Comments

Comments start with `#` and continue to the end of the line:

```mimo
# This is a comment
show "Hello"  # This is also a comment

# Comments can be used for documentation
# They are ignored by the interpreter
```

### Multi-line Comments

Currently, Mimo uses `#` for each line:

```mimo
# This is a multi-line comment
# that spans multiple lines
# to explain something complex
```

---

## Variables and Constants

### Variable Declaration

#### `set` - Mutable Global/Local Variable

```mimo
# Declare and initialize
set x 10
set name "Alice"
set is_active true

# Reassign
set x 20
set x + x 5  # x is now 25
```

#### `let` - Block-scoped Variable

```mimo
# Block scoped with let
let x 10

if true
    let x 20  # Different x, local to this block
    show x    # 20
end

show x  # 10 (outer x unchanged)
```

#### `const` - Immutable Constant

```mimo
# Constants cannot be reassigned
const PI 3.14159
const MAX_SIZE 100

# This would cause an error:
# set PI 3.14  # Error: Cannot modify const
```

#### `global` - Global Variable

```mimo
# Declare global variable
global counter 0

function increment()
    set counter + counter 1
end

call increment
show counter  # 1
```

### Scoping Rules

```mimo
set x 10      # Global scope

function example()
    let y 20  # Function scope
    set x 30  # Modifies global x
    
    if true
        let z 40     # Block scope
        show z       # 40
    end
    
    # show z  # Error: z not defined
    show y     # 20
end

call example
show x  # 30 (modified by function)
```

---

## Data Types

### Numbers

Mimo supports integers and floating-point numbers:

```mimo
# Integers
set count 42
set negative -17
set zero 0

# Floating-point
set pi 3.14159
set small 0.001
set scientific 1.5e10

# Arithmetic
set sum + 10 5          # 15
set difference - 20 8   # 12
set product * 6 7       # 42
set quotient / 15 3     # 5
set remainder % 10 3    # 1
```

### Strings

Strings are sequences of characters enclosed in double quotes:

```mimo
# String literals
set message "Hello, World!"
set empty ""
set with_quotes "She said \"Hello\""

# String concatenation
set greeting + "Hello, " "Alice"
show greeting  # "Hello, Alice"

# Concatenate with numbers (converted to string)
set message + "Count: " 42
show message  # "Count: 42"

# Multi-line strings (with explicit newline)
set multiline + "Line 1\n" "Line 2"
```

### Booleans

```mimo
# Boolean literals
set is_true true
set is_false false

# Boolean operations
set result and true false   # false
set result or true false    # true
set result not true         # false

# Comparison results are booleans
set result > 5 3   # true
set result = 4 4   # true
```

### Null

```mimo
# Null value
set nothing null

# Check for null
if = something null
    show "Value is null"
end
```

### Arrays

```mimo
# Array literals
set numbers [1 2 3 4 5]
set mixed [1 "two" true null]
set empty []

# Nested arrays
set matrix [
    [1 2 3]
    [4 5 6]
    [7 8 9]
]

# Access elements (0-indexed)
set first (get numbers 0)    # 1
set second (get numbers 1)   # 2

# Modify elements
set numbers (set numbers 0 10)  # [10, 2, 3, 4, 5]

# Array operations
set length (array.length numbers)
set sum (array.sum numbers)
set doubled (array.map numbers (fn x * 2 x))
```

### Objects (Maps/Dictionaries)

```mimo
# Object literals
set person {
    name: "Alice"
    age: 30
    active: true
}

# Nested objects
set user {
    profile: {
        name: "Bob"
        email: "bob@example.com"
    }
    settings: {
        theme: "dark"
        notifications: true
    }
}

# Access properties
set name (get person "name")      # "Alice"
set age person.age                # 30 (dot notation, if supported)

# Modify properties
set person (set person "age" 31)

# Add new properties
set person (set person "city" "NYC")

# Check property existence
if (has person "name")
    show "Has name property"
end
```

---

## Operators

### Arithmetic Operators

All arithmetic uses Polish notation:

```mimo
# Addition
+ 5 3         # 8
+ 1 2 3 4 5   # Error: + takes exactly 2 arguments

# Subtraction
- 10 4        # 6
- 100 50      # 50

# Multiplication
* 7 6         # 42
* -2 5        # -10

# Division
/ 15 3        # 5
/ 7 2         # 3.5

# Modulo (remainder)
% 10 3        # 1
% 17 5        # 2

# Negation
- 0 5         # -5
* -1 10       # -10
```

### Comparison Operators

```mimo
# Equal
= 5 5         # true
= "hi" "hi"   # true
= 3 4         # false

# Not equal
!= 5 3        # true
!= "a" "a"    # false

# Greater than
> 10 5        # true
> 3 3         # false

# Greater than or equal
>= 5 5        # true
>= 10 3       # true

# Less than
< 3 7         # true
< 5 5         # false

# Less than or equal
<= 5 5        # true
<= 3 10       # true
```

### Logical Operators

```mimo
# Logical AND
and true true          # true
and true false         # false
and false false        # false

# Logical OR
or true false          # true
or false false         # false
or true true           # true

# Logical NOT
not true               # false
not false              # true

# Complex expressions
and (> x 0) (< x 100)  # x is between 0 and 100
or (= x 0) (= x null)  # x is 0 or null
```

### String Operators

```mimo
# Concatenation
+ "Hello, " "World"    # "Hello, World"
+ "Count: " 42         # "Count: 42"

# Nested concatenation
+ + "A" "B" "C"        # "ABC"
+ "Result: " (+ "X" "Y")  # "Result: XY"
```

### Operator Precedence

**There is no operator precedence in Polish notation!** Evaluation is explicit:

```mimo
# In infix notation: 2 + 3 * 4 = 2 + 12 = 14
# In Mimo, you must be explicit:

+ 2 (* 3 4)   # 2 + (3 * 4) = 14
* (+ 2 3) 4   # (2 + 3) * 4 = 20
+ * 2 3 4     # (2 * 3) + 4 = 10 (left-to-right)
```

---

## Control Flow

### `if` Statement

```mimo
# Basic if
if > x 10
    show "x is greater than 10"
end

# if-else
if = x 0
    show "x is zero"
else
    show "x is not zero"
end

# if-elif-else (using else if)
if < x 0
    show "negative"
else if = x 0
    show "zero"
else
    show "positive"
end

# Nested if
if > x 0
    if < x 100
        show "x is between 0 and 100"
    end
end

# Complex conditions
if and (>= x 0) (<= x 100)
    show "x is in range [0, 100]"
end
```

### `while` Loop

```mimo
# Basic while loop
set i 0
while < i 5
    show i
    set i + i 1
end
# Prints: 0 1 2 3 4

# While with condition
set running true
while running
    # Do something
    if some_condition
        set running false
    end
end

# Infinite loop (use with caution)
while true
    show "Forever"
    break  # Exit loop
end
```

### `for` Loop

```mimo
# For-in loop (iterate over array)
set fruits ["apple" "banana" "cherry"]
for fruit in fruits
    show fruit
end

# For-in with range (if implemented)
for i in range 1 10
    show i
end

# Nested for loops
set matrix [[1 2] [3 4] [5 6]]
for row in matrix
    for cell in row
        show cell
    end
end
```

### `break` and `continue`

```mimo
# Break - exit loop early
set i 0
while < i 10
    if = i 5
        break
    end
    show i
    set i + i 1
end
# Prints: 0 1 2 3 4

# Continue - skip to next iteration
for i in range 1 10
    if = (% i 2) 0
        continue  # Skip even numbers
    end
    show i
end
# Prints: 1 3 5 7 9
```

---

## Functions

### Function Declaration

```mimo
# Basic function
function greet()
    show "Hello!"
end

# Call function
call greet

# Function with parameters
function greet(name)
    show + "Hello, " name
end

call greet "Alice"  # "Hello, Alice"

# Multiple parameters
function add(a b)
    return + a b
end

set result call add 5 3
show result  # 8
```

### Return Values

```mimo
# Explicit return
function square(x)
    return * x x
end

# Implicit return (last expression, if supported)
function double(x)
    * 2 x
end

# Early return
function abs(x)
    if < x 0
        return - 0 x
    end
    return x
end

# Multiple return points
function sign(x)
    if > x 0
        return "positive"
    else if < x 0
        return "negative"
    else
        return "zero"
    end
end
```

### Anonymous Functions (Lambdas)

```mimo
# Lambda syntax
set double (fn x * 2 x)

# Call lambda
set result call double 5
show result  # 10

# Multiple parameters
set add (fn a b + a b)
show call add 3 4  # 7

# Lambda with multiple statements
set complex (fn x
    let squared * x x
    let doubled * 2 squared
    return doubled
)

# Lambdas as arguments
set numbers [1 2 3 4 5]
set doubled call array.map numbers (fn x * 2 x)
show doubled  # [2, 4, 6, 8, 10]
```

### Higher-Order Functions

```mimo
# Function that returns a function
function make_adder(n)
    return (fn x + x n)
end

set add5 call make_adder 5
show call add5 10  # 15
show call add5 20  # 25

# Function that takes a function
function apply_twice(f x)
    return call f (call f x)
end

set double (fn x * 2 x)
show call apply_twice double 5  # 20 (5 * 2 * 2)
```

### Closures

```mimo
# Closures capture variables from outer scope
function make_counter()
    let count 0
    return (fn
        set count + count 1
        return count
    )
end

set counter call make_counter
show call counter  # 1
show call counter  # 2
show call counter  # 3

# Each closure has its own state
set counter2 call make_counter
show call counter2  # 1
show call counter   # 4
```

### Variadic Functions (if supported)

```mimo
# Rest parameters
function sum(...numbers)
    set total 0
    for n in numbers
        set total + total n
    end
    return total
end

show call sum 1 2 3 4 5  # 15
```

---

## Collections

### Arrays

```mimo
# Create array
set numbers [1 2 3 4 5]
set empty []

# Access elements
set first (get numbers 0)
set last (get numbers (- (array.length numbers) 1))

# Modify array (immutable operations)
set numbers (array.push numbers 6)      # [1,2,3,4,5,6]
set numbers (array.pop numbers)         # [1,2,3,4,5]
set numbers (array.insert numbers 0 0)  # [0,1,2,3,4,5]

# Array methods
set length (array.length numbers)
set sum (array.sum numbers)
set first (array.first numbers)
set last (array.last numbers)
set rest (array.rest numbers)  # All except first

# Higher-order array functions
set doubled (array.map numbers (fn x * 2 x))
set evens (array.filter numbers (fn x = (% x 2) 0))
set sum (array.reduce numbers + 0)

# Chaining operations
set result (
    array.map numbers (fn x * 2 x)
)
set result (
    array.filter result (fn x > x 5)
)
```

### Objects

```mimo
# Create object
set person {
    name: "Alice"
    age: 30
    city: "NYC"
}

# Access properties
set name (get person "name")
set age (get person "age")

# Set properties
set person (set person "age" 31)
set person (set person "email" "alice@example.com")

# Delete properties (if supported)
set person (delete person "city")

# Check property existence
if (has person "email")
    show "Email exists"
end

# Get keys
set keys (object.keys person)
# ["name", "age", "email"]

# Get values
set values (object.values person)
# ["Alice", 31, "alice@example.com"]

# Get entries
set entries (object.entries person)
# [["name", "Alice"], ["age", 31], ...]

# Merge objects
set defaults { theme: "light" lang: "en" }
set settings { theme: "dark" }
set merged (object.merge defaults settings)
# { theme: "dark", lang: "en" }
```

### Iteration

```mimo
# Iterate over array
for item in items
    show item
end

# Iterate with index (if supported)
for [index item] in (array.enumerate items)
    show + + index ": " item
end

# Iterate over object keys
for key in (object.keys person)
    show + + key ": " (get person key)
end

# Iterate over entries
for [key value] in (object.entries person)
    show + + key ": " value
end
```

---

## Pattern Matching

### `match` Statement

```mimo
# Basic pattern matching
match value
    case 1: show "one"
    case 2: show "two"
    case 3: show "three"
    default: show "other"
end

# Pattern matching with variables
match x
    case 0: show "zero"
    case n: show + "number: " n
end

# Multiple statements in case
match status
    case "pending":
        show "Processing..."
        call process_pending
    case "complete":
        show "Done!"
        call cleanup
    default:
        show "Unknown status"
end
```

### Destructuring Patterns

```mimo
# Array destructuring
match point
    case [0 0]:
        show "origin"
    case [x 0]:
        show + "on x-axis: " x
    case [0 y]:
        show + "on y-axis: " y
    case [x y]:
        show + + + "point (" x ", " + y ")"
end

# Object destructuring (if supported)
match person
    case { name: "Alice" }:
        show "Hello Alice!"
    case { name: n age: a }:
        show + + n " is " a
    default:
        show "Unknown person"
end
```

### Guards

```mimo
# Pattern with condition
match number
    case x when > x 0:
        show "positive"
    case x when < x 0:
        show "negative"
    case 0:
        show "zero"
end

# Complex guards
match age
    case a when and (>= a 0) (< a 13):
        show "child"
    case a when and (>= a 13) (< a 20):
        show "teenager"
    case a when >= a 20:
        show "adult"
    default:
        show "invalid age"
end
```

---

## Modules

### Importing Modules

```mimo
# Import entire module
import math from "math"

# Use module
set result call math.sqrt 16
show result  # 4

# Import specific items (if supported)
import { sqrt pow } from "math"

set result call sqrt 25
show result  # 5

# Import with alias
import math from "math" as m

set result call m.sqrt 9
show result  # 3
```

### Exporting from Modules

```mimo
# mymodule.mimo

# Export function
function add(a b)
    return + a b
end

function multiply(a b)
    return * a b
end

# Export variables
const PI 3.14159

# Make exports available
export { add multiply PI }
```

### Using Custom Modules

```mimo
# main.mimo

import mymodule from "./mymodule.mimo"

set sum call mymodule.add 5 3
set product call mymodule.multiply 4 7
show mymodule.PI
```

### Standard Library Modules

```mimo
# Array operations
import array from "array"

# String operations
import string from "string"

# Math functions
import math from "math"

# File system (Node.js only)
import fs from "fs"

# HTTP requests
import http from "http"

# JSON parsing
import json from "json"

# Regular expressions
import regex from "regex"

# Date and time
import datetime from "datetime"
```

---

## Error Handling

### `try-catch` Statement

```mimo
# Basic try-catch
try
    set result / 10 0
catch error
    show + "Error: " error
end

# Try-catch with specific error handling
try
    set data call parse_json invalid_string
catch error
    show "Failed to parse JSON"
    set data null
end
```

### Throwing Errors

```mimo
# Throw error with message
function divide(a b)
    if = b 0
        throw "Division by zero"
    end
    return / a b
end

# Use the function
try
    set result call divide 10 0
catch error
    show error  # "Division by zero"
end
```

### Error Propagation

```mimo
# Errors propagate up the call stack
function inner()
    throw "Something went wrong"
end

function outer()
    call inner  # Error propagates from here
end

try
    call outer
catch error
    show + "Caught: " error
end
```

---

## Standard Library

### Math Module

```mimo
import math from "math"

# Basic operations
show call math.abs -5        # 5
show call math.sqrt 16       # 4
show call math.pow 2 8       # 256
show call math.floor 3.7     # 3
show call math.ceil 3.2      # 4
show call math.round 3.5     # 4

# Trigonometry
show call math.sin (/ math.PI 2)    # 1
show call math.cos 0                # 1
show call math.tan (/ math.PI 4)    # 1

# Random numbers
show call math.random        # 0.0 to 1.0 (seeded if math.seed was called)
show call math.seed 42       # Sets the seed for the RNG
show call math.randint 1 10  # Random integer between 1 and 10 (inclusive)


# Constants
show math.PI                 # 3.14159...
show math.E                  # 2.71828...
```

### String Module

```mimo
import string from "string"

# String operations
show call string.length "hello"          # 5
show call string.to_upper "hello"        # "HELLO"
show call string.to_lower "WORLD"        # "world"
show call string.to_title_case "hi all"  # "Hi All"
show call string.capitalize "mimo"       # "Mimo"
show call string.trim "  hi  "           # "hi"


# Substring
show call string.substring "hello" 1 4   # "ell"
show call string.slice "hello" 0 3       # "hel"

# Search and replace
show call string.contains "hello" "ll"   # true
show call string.starts-with "hello" "he"  # true
show call string.ends-with "hello" "lo"    # true
show call string.index-of "hello" "l"      # 2
show call string.replace "hello" "l" "r"   # "herro"

# Split and join
set parts call string.split "a,b,c" ","
show parts  # ["a", "b", "c"]
show call string.join parts "-"  # "a-b-c"

# Character codes
show call string.char-code "A"    # 65
show call string.from-char-code 65  # "A"
```

### Array Module

```mimo
import array from "array"

set numbers [1 2 3 4 5]

# Array operations
show call array.length numbers       # 5
show call array.first numbers        # 1
show call array.last numbers         # 5
show call array.rest numbers         # [2, 3, 4, 5]

# Modification (returns new array)
show call array.push numbers 6       # [1, 2, 3, 4, 5, 6]
show call array.pop numbers          # [1, 2, 3, 4]
show call array.concat numbers [6 7] # [1, 2, 3, 4, 5, 6, 7]
show call array.reverse numbers      # [5, 4, 3, 2, 1]
show call array.sort numbers         # [1, 2, 3, 4, 5]
show call array.shuffle numbers      # Randomly shuffled array
show call array.unique numbers       # Array with unique elements


# Higher-order functions
set doubled call array.map numbers (fn x * 2 x)
show doubled  # [2, 4, 6, 8, 10]

set evens call array.filter numbers (fn x = (% x 2) 0)
show evens  # [2, 4]

set sum call array.reduce numbers (fn acc x + acc x) 0
show sum  # 15

# Search
show call array.contains numbers 3     # true
show call array.index-of numbers 3     # 2
show call array.find numbers (fn x > x 3)  # 4

# Slicing
show call array.slice numbers 1 4      # [2, 3, 4]
show call array.take numbers 3         # [1, 2, 3]
show call array.drop numbers 2         # [3, 4, 5]

# Aggregation
show call array.sum numbers            # 15
show call array.min numbers            # 1
show call array.max numbers            # 5
show call array.average numbers        # 3

# Set Operations
set a1 [1, 2, 3]
set a2 [3, 4, 5]
show call array.intersection a1 a2   # [3]
show call array.union a1 a2          # [1, 2, 3, 4, 5]
show call array.difference a1 a2     # [1, 2]

```

### Object Module

```mimo
# Object utilities
set obj { a: 1 b: 2 c: 3 }

show call object.keys obj       # ["a", "b", "c"]
show call object.values obj     # [1, 2, 3]
show call object.entries obj    # [["a", 1], ["b", 2], ["c", 3]]

# Check properties
show call object.has obj "a"    # true
show call object.has obj "x"    # false

# Merge objects
set obj2 { d: 4 e: 5 }
show call object.merge obj obj2
# { a: 1, b: 2, c: 3, d: 4, e: 5 }
```

### File System Module (Node.js)

```mimo
import fs from "fs"

# Read file
set content call fs.read "file.txt"
show content

# Write file
call fs.write "output.txt" "Hello, World!"

# Check if file exists
if call fs.exists "file.txt"
    show "File exists"
end

# List directory
set files call fs.list-dir "."
for file in files
    show file
end

# File info
set info call fs.stat "file.txt"
show info.size
show info.modified
```

### HTTP Module

```mimo
import http from "http"

# GET request
set response call http.get "https://api.example.com/data"
show response.status  # 200
show response.body    # Response body as string

# POST request
set response call http.post "https://api.example.com/create" {
    headers: { "Content-Type": "application/json" }
    body: (call json.stringify { name: "Alice" })
}

show response.status
```

### JSON Module

```mimo
import json from "json"

# Parse JSON string
set data call json.parse "{\"name\": \"Alice\", \"age\": 30}"
show data.name  # "Alice"

# Stringify object
set obj { name: "Bob" age: 25 }
set json_string call json.stringify obj
show json_string  # {"name":"Bob","age":25}

# Pretty print
set pretty call json.stringify obj { indent: 2 }
show pretty
```

### Regex Module

```mimo
import regex from "regex"

# Create regex
set pattern call regex.create "^[a-z]+$"

# Test match
show call regex.test pattern "hello"    # true
show call regex.test pattern "Hello"    # false

# Find matches
set text "The year is 2024"
set numbers call regex.match text "\d+"
show numbers  # ["2024"]

# Replace
set result call regex.replace "hello world" "world" "Mimo"
show result  # "hello Mimo"
```

### DateTime Module

```mimo
import datetime from "datetime"

# Current time
set now call datetime.now
show now  # Unix timestamp

# Create date
set date call datetime.create 2024 1 1
show date

# Format date
set formatted call datetime.format now "YYYY-MM-DD"
show formatted  # "2024-01-15"

# Parse date
set parsed call datetime.parse "2024-01-15" "YYYY-MM-DD"

# Date arithmetic
set tomorrow call datetime.add now 1 "days"
set next_week call datetime.add now 7 "days"

# Difference
set diff call datetime.diff tomorrow now "hours"
show diff  # 24
```

---

## Style Guide

### Naming Conventions

```mimo
# Variables and functions: snake_case
set user_name "Alice"
set total_count 100

function calculate_sum(a b)
    return + a b
end

# Constants: UPPER_SNAKE_CASE
const MAX_SIZE 1000
const API_KEY "secret"

# Private functions: prefix with underscore
function _internal_helper()
    # Internal use only
end
```

### Indentation

Use consistent indentation (2 or 4 spaces):

```mimo
# 2-space indentation
if > x 0
  if < x 100
    show "in range"
  end
end

# 4-space indentation
if > x 0
    if < x 100
        show "in range"
    end
end
```

### Spacing

```mimo
# Space after operator
set x + 5 3        # Good
set x +5 3         # Avoid

# Space around parentheses
set y (* 2 (+ 3 4))   # Good
set y (*2(+3 4))      # Avoid

# Blank lines between logical sections
function process_data(data)
    let cleaned call clean_data data
    
    let validated call validate_data cleaned
    
    let result call transform_data validated
    return result
end
```

### Line Length

Keep lines under 80-100 characters:

```mimo
# Long expression - break into multiple lines
set result + + + "This is " "a very " "long " "concatenation"

# Better - use intermediate variables
set part1 + "This is " "a very "
set part2 + "long " "concatenation"
set result + part1 part2

# Or format vertically
set result +
    + + "This is " "a very "
    + "long " "concatenation"
```

### Comments

```mimo
# Use comments to explain WHY, not WHAT
# Good:
# Calculate checksum to verify data integrity
set checksum call calculate_checksum data

# Avoid:
# Call calculate_checksum with data
set checksum call calculate_checksum data
```

### Function Organization

```mimo
# 1. Constants at the top
const MAX_RETRIES 3
const TIMEOUT 5000

# 2. Helper functions
function _validate_input(x)
    return and (is-number x) (> x 0)
end

# 3. Main functions
function process(x)
    if not call _validate_input x
        throw "Invalid input"
    end
    return * x 2
end

# 4. Main execution
set result call process 10
show result
```

---

## Complete Example Program

Here's a complete Mimo program demonstrating multiple features:

```mimo
# Todo List Manager
# Demonstrates Mimo language features

# Constants
const MAX_TODOS 100

# Global state
global todos []
global next_id 1

# Helper function to create a todo
function create_todo(title)
    return {
        id: next_id
        title: title
        completed: false
        created_at: call datetime.now
    }
end

# Add a new todo
function add_todo(title)
    if >= (array.length todos) MAX_TODOS
        show "Error: Maximum todos reached"
        return null
    end
    
    let todo call create_todo title
    set todos call array.push todos todo
    set next_id + next_id 1
    
    show + "Added: " title
    return todo
end

# Mark todo as complete
function complete_todo(id)
    set todos call array.map todos (fn todo
        if = todo.id id
            return (set todo "completed" true)
        end
        return todo
    )
    show + "Completed todo #" id
end

# Remove a todo
function remove_todo(id)
    set todos call array.filter todos (fn todo
        != todo.id id
    )
    show + "Removed todo #" id
end

# Display all todos
function show_todos()
    show "\n=== Todo List ==="
    
    if = (array.length todos) 0
        show "No todos yet!"
        return
    end
    
    for todo in todos
        set status if todo.completed "[X]" "[ ]"
        show + + + + status " #" todo.id ": " todo.title
    end
    
    show + + "\nTotal: " (array.length todos) " todos"
end

# Main program
show "Todo List Manager"
show "================\n"

# Add some todos
call add_todo "Buy groceries"
call add_todo "Write documentation"
call add_todo "Review code"

# Show current state
call show_todos

# Complete a todo
call complete_todo 2

# Show updated state
call show_todos

# Remove a todo
call remove_todo 1

# Show final state
call show_todos

# Get statistics
set completed_count call array.reduce todos (fn acc todo
    if todo.completed
        return + acc 1
    end
    return acc
) 0

show + + "\nCompleted: " completed_count " todos"
```

---

## Quick Reference Card

### Variables
```mimo
set x 10          # Mutable variable
let x 10          # Block-scoped variable
const PI 3.14     # Constant
global count 0    # Global variable
```

### Operators
```mimo
+ 5 3             # Addition (8)
- 10 4            # Subtraction (6)
* 7 6             # Multiplication (42)
/ 15 3            # Division (5)
% 10 3            # Modulo (1)
= 5 5             # Equal (true)
!= 3 4            # Not equal (true)
> 10 5            # Greater than (true)
< 3 7             # Less than (true)
and true false    # Logical AND (false)
or true false     # Logical OR (true)
not true          # Logical NOT (false)
```

### Control Flow
```mimo
if condition      # Conditional
    # code
end

while condition   # While loop
    # code
end

for item in list  # For loop
    # code
end

match value       # Pattern matching
    case x: code
end
```

### Functions
```mimo
function name(x)  # Function definition
    return x
end

call name arg     # Function call

set fn (fn x      # Anonymous function
    return x
)
```

### Collections
```mimo
[1 2 3]          # Array
{ a: 1 b: 2 }    # Object
get coll key     # Access element
```

### Modules
```mimo
import mod from "mod"     # Import
export { func1 func2 }    # Export
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
# Wrong: Missing parentheses
set x + 2 * 3 4  # This is (+ 2 (* 3 4)) = 14

# Correct: Use parentheses for clarity
set x * (+ 2 3) 4  # This is (* (+ 2 3) 4) = 20
```

### Wrong Argument Order
```mimo
# Wrong: Arguments in wrong order
set result - 3 10  # 3 - 10 = -7

# Correct: First arg minus second arg
set result - 10 3  # 10 - 3 = 7
```

### Missing Return
```mimo
# Wrong: No return statement
function square(x)
    * x x  # Result is lost
end

# Correct: Explicit return
function square(x)
    return * x x
end
```

---

This guide covers the core syntax of Mimo. For more advanced features and standard library details, consult the official documentation.

Happy coding in Mimo! 