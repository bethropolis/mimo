# Data Types

## Numbers

Mimo supports integers and floating-point numbers:

```mimo
// Integers
set count 42
set negative -17
set zero 0

// Floating-point
set pi 3.14159
set small 0.001
set scientific 1.5e10

// Arithmetic
set sum + 10 5          // 15
set difference - 20 8   // 12
set product * 6 7       // 42
set quotient / 15 3     // 5
set remainder % 10 3    // 1
```

## Strings

Strings are sequences of characters enclosed in double quotes:

```mimo
// String literals
set message "Hello, World!"
set empty ""
set with_quotes "She said \"Hello\""

// Template literals (backticks, with interpolation)
set name "Alice"
set greeting `Hello, ${name}!`

// String concatenation
set greeting + "Hello, " "Alice"
show greeting  // "Hello, Alice"

// Concatenate with numbers (converted to string)
set message + "Count: " 42
show message  // "Count: 42"

// Multi-line strings (with explicit newline)
set multiline + "Line 1\n" "Line 2"
```

## Booleans

```mimo
// Boolean literals
set is_true true
set is_false false

// Boolean operations
set result and true false   // false
set result or true false    // true
set result not true         // false

// Comparison results are booleans
set result > 5 3   // true
set result = 4 4   // true
```

## Null

```mimo
// Null value
set nothing null

// Check for null
if = something null
    show "Value is null"
end
```

## Arrays

```mimo
// Array literals (comma-separated)
set numbers [1, 2, 3, 4, 5]
set mixed [1, "two", true, null]
set empty []

// Nested arrays
set matrix [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]

// Access elements (0-indexed)
set first (get numbers 0)    // 1
set second (get numbers 1)   // 2

// Bracket notation for array access
set first numbers[0]         // 1

// Modify elements
set numbers (update numbers 0 10)  // [10, 2, 3, 4, 5]

// Array operations
set length (len numbers)
set doubled (array.map numbers (fn x, * 2 x))
```

## Objects (Maps/Dictionaries)

```mimo
// Object literals (comma-separated)
set person {
    name: "Alice",
    age: 30,
    active: true
}

// Nested objects
set user {
    profile: {
        name: "Bob",
        email: "bob@example.com"
    },
    settings: {
        theme: "dark",
        notifications: true
    }
}

// Access properties
set name (get person "name")      // "Alice"
set age person.age                // 30 (dot notation)

// Bracket notation for dynamic access
set key "name"
set name person[key]              // "Alice"

// Modify properties
set person.age 31                 // Updates age to 31

// Add new properties
set person.city "NYC"

// Check property existence
if (has_property person "name")
    show "Has name property"
end
```
