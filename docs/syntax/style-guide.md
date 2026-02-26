# Style Guide

## Naming Conventions

```mimo
// Variables and functions: snake_case
set user_name "Alice"
set total_count 100

function calculate_sum(a, b)
    return + a b
end

// Constants: UPPER_SNAKE_CASE
const MAX_SIZE 1000
const API_KEY "secret"

// Private functions: prefix with underscore
function _internal_helper()
    // Internal use only
end
```

## Indentation

Use consistent indentation (2 or 4 spaces):

```mimo
// 2-space indentation
if > x 0
  if < x 100
    show "in range"
  end
end

// 4-space indentation
if > x 0
    if < x 100
        show "in range"
    end
end
```

## Spacing

```mimo
// Space after operator
set x + 5 3        // Good
set x +5 3         // Avoid

// Space around parentheses
set y (* 2 (+ 3 4))   // Good
set y (*2(+3 4))      // Avoid

// Blank lines between logical sections
function process_data(data)
    let cleaned call clean_data(data)
    
    let validated call validate_data(cleaned)
    
    let result call transform_data(validated)
    return result
end
```

## Line Length

Keep lines under 80-100 characters:

```mimo
// Long expression - break into multiple lines
set result + + + "This is " "a very " "long " "concatenation"

// Better - use intermediate variables
set part1 + "This is " "a very "
set part2 + "long " "concatenation"
set result + part1 part2
```

## Comments

```mimo
// Use comments to explain WHY, not WHAT
// Good:
// Calculate checksum to verify data integrity
set checksum call calculate_checksum(data)

// Avoid:
// Call calculate_checksum with data
set checksum call calculate_checksum(data)
```

## Function Organization

```mimo
// 1. Constants at the top
const MAX_RETRIES 3
const TIMEOUT 5000

// 2. Helper functions
function _validate_input(x)
    return and (type x = "number") (> x 0)
end

// 3. Main functions
function process(x)
    if not call _validate_input(x)
        throw "Invalid input"
    end
    return * x 2
end

// 4. Main execution
call process(10) -> result
show result
```
