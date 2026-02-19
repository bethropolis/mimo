# Collections

## Arrays

```mimo
// Create array
set numbers [1, 2, 3, 4, 5]
set empty []

// Access elements
set first numbers[0]
set last numbers[- (len numbers) 1]

// Modify array
call push(numbers, 6)      // [1,2,3,4,5,6]
call pop(numbers)          // Returns last element

// Array methods
set length (len numbers)
set first (array.first numbers)
set last (array.last numbers)
set rest (array.rest numbers)  // All except first

// Higher-order array functions
set doubled (array.map numbers (fn x, * 2 x))
set evens (array.filter numbers (fn x, = (% x 2) 0))

// Slicing
set slice (array.slice numbers 1 4)  // [2, 3, 4]
```

### Array Destructuring

```mimo
// Extract values into variables
set coords [10, 20, 30]
destructure [x, y, z] from coords
show x  // 10
show y  // 20

// Partial destructuring
destructure [first, second] from [1, 2, 3, 4]
show first  // 1
```

See [Destructuring](./destructuring.md) for full details.

### Array Spreading

```mimo
// Combine arrays
set a [1, 2]
set b [3, 4]
set combined [...a, ...b]
show combined  // [1, 2, 3, 4]

// With additional elements
set extended [0, ...a, 5]
show extended  // [0, 1, 2, 5]
```

See [Array Operations](./array-operations.md) for slicing, spreading, and more.

## Objects

```mimo
// Create object
set person {
    name: "Alice",
    age: 30,
    city: "NYC"
}

// Access properties
set name person.name
set age person["age"]

// Set properties
set person.age 31
set person.email "alice@example.com"

// Check property existence
if (has_property person "email")
    show "Email exists"
end

// Get keys
set keys (keys person)
// ["name", "age", "city"]

// Get values
set vals (values person)
// ["Alice", 31, "NYC"]

// Get entries
set entries (entries person)
// [["name", "Alice"], ["age", 31], ...]
```

### Object Destructuring

```mimo
// Extract properties into variables
set user { name: "Bob", age: 25 }
destructure {name, age} from user
show name  // "Bob"
show age   // 25

// Missing properties become null
set config { timeout: 5000 }
destructure {timeout, retries} from config
show timeout  // 5000
show retries  // null
```

See [Destructuring](./destructuring.md) for full details.

## Iteration

```mimo
// Iterate over array
for item in items
    show item
end

// Iterate with index
for i in range 0 (len items)
    show + "Index " i
    show items[i]
end

// Iterate over object keys
for key in (keys person)
    show + key ": " (person[key])
end
```
