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

// Inline if expression
set label if > score 59 then "pass" else "fail"
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

## `guard` Statement

```mimo
function process_user(user)
    guard != user null else
        throw "user is null"
    end
    guard != user?.name null else
        throw "missing user name"
    end

    show + "Processing " user.name
end
```

## Match Guards with `when`

```mimo
match score
    case n when >= n 90: show "A"
    case n when >= n 80: show "B"
    case n when >= n 70: show "C"
    default: show "F"
end
```

## `loop` - Infinite Loop

The `loop` statement creates an infinite loop. Use `break` to exit.

```mimo
// Basic infinite loop with break
set counter 0
loop
    show counter
    set counter + counter 1
    if = counter 5
        break
    end
end
// Prints: 0 1 2 3 4

// Loop with continue
set x 0
loop
    set x + x 1
    if < x 3
        continue  // Skip printing for x < 3
    end
    show x
    if = x 5
        break
    end
end
// Prints: 3 4 5

// Event loop pattern
set running true
loop
    if not running
        break
    end
    // Process events...
    // Set running to false when done
end

// Searching with early exit
set items [1, 3, 5, 8, 10, 12]
set target 8
set found_index -1
set i 0
loop
    if >= i (len items)
        break
    end
    if = items[i] target
        set found_index i
        break
    end
    set i + i 1
end
show found_index  // 3
```

### Nested Loop Control

```mimo
// Breaking from nested loops
set matrix [[1, 2], [3, 4], [5, 6]]
set found false
set target 4

for row in matrix
    for element in row
        if = element target
            set found true
            break  // Only breaks inner loop
        end
    end
    if found
        break  // Break outer loop
    end
end
```
