# Operators

## Arithmetic Operators

All arithmetic uses Polish notation:

```mimo
// Addition
+ 5 3         // 8

// Subtraction
- 10 4        // 6

// Multiplication
* 7 6         // 42

// Division
/ 15 3        // 5
/ 7 2         // 3.5

// Modulo (remainder)
% 10 3        // 1
```

## Comparison Operators

```mimo
// Equal
= 5 5         // true
= "hi" "hi"   // true

// Not equal
!= 5 3        // true

// Greater than
> 10 5        // true

// Greater than or equal
>= 5 5        // true

// Less than
< 3 7         // true

// Less than or equal
<= 5 5        // true
```

## Logical Operators

```mimo
// Logical AND
and true true          // true
and true false         // false

// Logical OR
or true false          // true
or false false         // false

// Logical NOT
not true               // false

// Complex expressions
and (> x 0) (< x 100)  // x is between 0 and 100
or (= x 0) (= x null)  // x is 0 or null
```

## Null-Safety and Flow Operators

```mimo
// Null coalescing
?? null "fallback"            // "fallback"
?? "value" "fallback"         // "value"

// Optional chaining
user?.profile?.name           // null-safe property access
items?.[0]                    // null-safe index access
format?.("x")                 // null-safe call

// Pipe operator
"  hello  "
    |> string.trim()
    |> string.to_upper()
```

## String Operators

```mimo
// Concatenation
+ "Hello, " "World"    // "Hello, World"
+ "Count: " 42         // "Count: 42"

// Nested concatenation
+ + "A" "B" "C"        // "ABC"
```

## Operator Precedence

**There is no operator precedence in Polish notation!** Evaluation is explicit:

```mimo
// In infix notation: 2 + 3 * 4 = 2 + 12 = 14
// In Mimo, you must be explicit:

+ 2 (* 3 4)   // 2 + (3 * 4) = 14
* (+ 2 3) 4   // (2 + 3) * 4 = 20
+ * 2 3 4     // (2 * 3) + 4 = 10 (left-to-right)
```
