# Functions

## Function Declaration

```mimo
// Basic function
function greet()
    show "Hello!"
end

// Call function
call greet

// Function with parameters (comma-separated)
function greet(name)
    show + "Hello, " name
end

call greet "Alice"  // "Hello, Alice"

// Multiple parameters
function add(a, b)
    return + a b
end

// Function call with result assignment
call add(5, 3) -> result
show result  // 8

// Alternative call syntax
set result call add 5 3
```

## Return Values

```mimo
// Explicit return
function square(x)
    return * x x
end

// Early return
function abs(x)
    if < x 0
        return - 0 x
    end
    return x
end

// Multiple return points
function sign(x)
    if > x 0
        return "positive"
    elif < x 0
        return "negative"
    else
        return "zero"
    end
end
```

## Anonymous Functions

```mimo
// Anonymous function syntax
set double function(x)
    return * 2 x
end

// Call anonymous function
call double(5) -> result
show result  // 10

// Multiple parameters
set add function(a, b)
    return + a b
end
call add(3, 4) -> result
show result  // 7

// Anonymous functions in expressions
set numbers [1, 2, 3, 4, 5]
set doubled call array.map numbers (fn x, * 2 x)
show doubled  // [2, 4, 6, 8, 10]
```

## Default Parameters

```mimo
// Function with default parameter values
function greet(name: "World", greeting: "Hello")
    return + greeting + ", " name
end

call greet() -> g1          // "Hello, World"
call greet("Alice") -> g2   // "Hello, Alice"
call greet("Bob", "Hi") -> g3  // "Hi, Bob"
```

## Variadic Functions

```mimo
// Rest parameters
function sum(...numbers)
    set total 0
    for n in numbers
        set total + total n
    end
    return total
end

call sum(1, 2, 3, 4, 5) -> result
show result  // 15
```
