# Array Operations

Advanced array operations including slicing, spreading, and manipulation.

## Array Slicing

The `slice` function extracts a portion of an array without modifying the original.

### Basic Slicing

```mimo
set numbers [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

// Slice from index 2 to 5 (exclusive)
call slice(numbers, 2, 5) -> part
show part  // [2, 3, 4]

// From beginning
call slice(numbers, 0, 3) -> first_three
show first_three  // [0, 1, 2]

// To end (use null for open-ended)
call slice(numbers, 5, null) -> from_five
show from_five  // [5, 6, 7, 8, 9]

// From beginning (null start)
call slice(numbers, null, 3) -> first_part
show first_part  // [0, 1, 2]

// Full copy
call slice(numbers, null, null) -> copy
show copy  // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
```

### Negative Indices

```mimo
set numbers [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

// Last 3 elements
call slice(numbers, -3, null) -> last_three
show last_three  // [7, 8, 9]

// All but last 2
call slice(numbers, null, -2) -> most
show most  // [0, 1, 2, 3, 4, 5, 6, 7]

// From -5 to -2
call slice(numbers, -5, -2) -> middle
show middle  // [5, 6, 7]
```

### Edge Cases

```mimo
// Empty slice
call slice(numbers, 5, 5) -> empty
show empty  // []

// Start > end
call slice(numbers, 3, 2) -> also_empty
show also_empty  // []

// Out of bounds (clamped)
call slice(numbers, 8, 15) -> clamped
show clamped  // [8, 9]

// Start beyond array
call slice(numbers, 15, 20) -> beyond
show beyond  // []
```

## Array Spreading

Spread syntax (`...`) expands an array into individual elements.

### Combining Arrays

```mimo
set a [1, 2, 3]
set b [4, 5, 6]

// Combine two arrays
set combined [...a, ...b]
show combined  // [1, 2, 3, 4, 5, 6]

// With additional elements
set extended [0, ...a, 10, ...b, 20]
show extended  // [0, 1, 2, 3, 10, 4, 5, 6, 20]
```

### Multiple Arrays

```mimo
set first [1, 2]
set second [3, 4]
set third [5, 6]

set all [...first, ...second, ...third]
show all  // [1, 2, 3, 4, 5, 6]
```

### Copying Arrays

```mimo
set original [1, 2, 3]

// Shallow copy
set copy [...original]
show copy  // [1, 2, 3]
```

### With Mixed Data

```mimo
set numbers [1, 2, 3]
set strings ["a", "b"]
set booleans [true, false]

set mixed [...numbers, ...strings, ...booleans, null]
show mixed  // [1, 2, 3, "a", "b", true, false, null]
```

### In Functions

```mimo
function wrap_array(arr)
    return [0, ...arr, 100]
end

call wrap_array([5, 10, 15]) -> wrapped
show wrapped  // [0, 5, 10, 15, 100]
```

### With Objects

```mimo
set people [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 }
]

set more [
    { name: "Charlie", age: 35 }
]

set everyone [...people, ...more]
show everyone[0].name  // "Alice"
show everyone[2].name  // "Charlie"
```

## Combining Slicing and Spreading

```mimo
set original [1, 2, 3, 4, 5, 6, 7, 8, 9]

call slice(original, 0, 3) -> first_part
call slice(original, 6, 9) -> last_part

set reconstructed [...first_part, ...last_part]
show reconstructed  // [1, 2, 3, 7, 8, 9]
```

## Error Handling

```mimo
// Cannot spread non-iterable
try
    set invalid [...42]
catch err
    show "Cannot spread from number"
end

try
    set also_invalid [..."string"]
catch err
    show "Cannot spread from string"
end
```
