# Control Flow

## `if` Statement

```mimo
// Basic if
if > x 10
    show "x is greater than 10"
end

// if-else
if = x 0
    show "x is zero"
else
    show "x is not zero"
end

// if-elif-else
if < x 0
    show "negative"
elif = x 0
    show "zero"
else
    show "positive"
end

// Nested if
if > x 0
    if < x 100
        show "x is between 0 and 100"
    end
end

// Complex conditions
if and (>= x 0) (<= x 100)
    show "x is in range [0, 100]"
end
```

## `while` Loop

```mimo
// Basic while loop
set i 0
while < i 5
    show i
    set i + i 1
end
// Prints: 0 1 2 3 4

// While with condition
set running true
while running
    // Do something
    if some_condition
        set running false
    end
end

// Infinite loop (use with caution)
while true
    show "Forever"
    break  // Exit loop
end
```

## `for` Loop

```mimo
// For-in loop (iterate over array)
set fruits ["apple", "banana", "cherry"]
for fruit in fruits
    show fruit
end

// For-in with range
for i in range 1 10
    show i
end

// Nested for loops
set matrix [[1, 2], [3, 4], [5, 6]]
for row in matrix
    for cell in row
        show cell
    end
end
```

## `break` and `continue`

```mimo
// Break - exit loop early
set i 0
while < i 10
    if = i 5
        break
    end
    show i
    set i + i 1
end
// Prints: 0 1 2 3 4

// Continue - skip to next iteration
for i in range 1 10
    if = (% i 2) 0
        continue  // Skip even numbers
    end
    show i
end
// Prints: 1 3 5 7 9
```
