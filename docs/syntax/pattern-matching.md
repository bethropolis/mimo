# Pattern Matching

## `match` Statement

```mimo
// Basic pattern matching
match value
    case 1: show "one"
    case 2: show "two"
    case 3: show "three"
    default: show "other"
end

// Pattern matching with variables
match x
    case 0: show "zero"
    case n: show + "number: " n
end

// Multiple statements in case
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

## Destructuring Patterns

```mimo
// Array destructuring
match point
    case []:
        show "empty array"
    case [0, 0]:
        show "origin"
    case [x, 0]:
        show + "on x-axis: " x
    case [0, y]:
        show + "on y-axis: " y
    case [x, y]:
        show + + + "point (" x ", " y ")"
end

// Object destructuring
match person
    case { name: "Alice" }:
        show "Hello Alice!"
    case { name: n, age: a }:
        show + + n " is " a
    default:
        show "Unknown person"
end
```
