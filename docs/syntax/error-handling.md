# Error Handling

## `try-catch` Statement

```mimo
// Basic try-catch
try
    set result / 10 0
catch error
    show + "Error: " error
end

// Try-catch with specific error handling
try
    set data call json.parse(invalid_string)
catch error
    show "Failed to parse JSON"
    set data null
end
```

## Throwing Errors

```mimo
// Throw error with message
function divide(a, b)
    if = b 0
        throw "Division by zero"
    end
    return / a b
end

// Use the function
try
    call divide(10, 0) -> result
catch error
    show error  // "Division by zero"
end
```

## Error Propagation

```mimo
// Errors propagate up the call stack
function inner()
    throw "Something went wrong"
end

function outer()
    call inner()  // Error propagates from here
end

try
    call outer()
catch error
    show + "Caught: " error
end
```
