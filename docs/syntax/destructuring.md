# Destructuring

Destructuring allows you to extract values from arrays and objects into individual variables.

## Array Destructuring

### Basic Syntax

```mimo
// Destructure array elements into variables
set coords [10, 20, 30]
destructure [x, y, z] from coords
show x  // 10
show y  // 20
show z  // 30
```

### Partial Destructuring

```mimo
// Extract only the first few elements
destructure [first, second] from [1, 2, 3, 4, 5]
show first   // 1
show second  // 2
```

### Extra Variables

```mimo
// Extra variables are set to null
destructure [a, b, c] from [1, 2]
show a  // 1
show b  // 2
show c  // null
```

### From Function Return

```mimo
function get_point()
    return [100, 200]
end

destructure [x, y] from call get_point()
show x  // 100
show y  // 200
```

## Object Destructuring

### Basic Syntax

```mimo
// Destructure object properties into variables
set person { name: "Alice", age: 30, city: "NYC" }
destructure {name, age} from person
show name  // "Alice"
show age   // 30
```

### Missing Properties

```mimo
// Missing properties are set to null
set config { timeout: 5000 }
destructure {timeout, retries} from config
show timeout  // 5000
show retries  // null
```

### From Function Return

```mimo
function get_settings()
    return { enabled: true, mode: "production" }
end

destructure {enabled, mode} from call get_settings()
show enabled  // true
show mode     // "production"
```

### Nested Objects

```mimo
// Destructure from nested objects step by step
set api_response {
    data: { users: ["Alice", "Bob"] },
    meta: { count: 2 }
}

destructure {data, meta} from api_response
destructure {users} from data
destructure {count} from meta

show users  // ["Alice", "Bob"]
show count  // 2
```

## Re-assignment

```mimo
// Variables can be re-assigned through destructuring
set x 0
set y 0

set point { x: 100, y: 200 }
destructure {x, y} from point
show x  // 100
show y  // 200

set coords [300, 400]
destructure [x, y] from coords
show x  // 300
show y  // 400
```

## Error Handling

```mimo
// Destructuring from incompatible type throws error
try
    destructure [a, b] from 42
catch err
    show "Cannot destructure from non-array"
end

try
    destructure {x, y} from "string"
catch err
    show "Cannot destructure from non-object"
end
```

## Practical Examples

### Function Parameters

```mimo
function process_user(data)
    destructure {name, email} from data
    show + "Processing user: " name
    return + name "@example.com"
end

set user { name: "Bob", email: "bob@mail.com" }
call process_user(user) -> result
show result  // "Bob@example.com"
```

### Configuration Defaults

```mimo
function setup(options)
    destructure {host, port} from options
    // Use defaults for missing values
    set actual_host call coalesce(host, "localhost")
    set actual_port call coalesce(port, 8080)
    show + + "Server: " actual_host ":" actual_port
end

call setup({ host: "production.server" })
// Server: production.server:8080
```
