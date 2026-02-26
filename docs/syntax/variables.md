# Variables and Constants

## Variable Declaration

### `set` - Mutable Global/Local Variable

```mimo
// Declare and initialize
set x 10
set name "Alice"
set is_active true

// Reassign
set x 20
set x + x 5  // x is now 25
```

### `let` - Block-scoped Variable

```mimo
// Block scoped with let
let x 10

if true
    let x 20  // Different x, local to this block
    show x    // 20
end

show x  // 10 (outer x unchanged)
```

### `const` - Immutable Constant

```mimo
// Constants cannot be reassigned
const PI 3.14159
const MAX_SIZE 100

// This would cause an error:
// set PI 3.14  // Error: Cannot modify const
```

### `global` - Global Variable

```mimo
// Declare global variable
global counter 0

function increment()
    set counter + counter 1
end

call increment()
show counter  // 1
```

## Scoping Rules

```mimo
set x 10      // Global scope

function example()
    let y 20  // Function scope
    set x 30  // Modifies global x
    
    if true
        let z 40     // Block scope
        show z       // 40
    end
    
    // show z  // Error: z not defined
    show y     // 20
end

call example()
show x  // 30 (modified by function)
```
