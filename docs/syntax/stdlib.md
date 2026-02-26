# Standard Library

## Math Module

```mimo
import math from "math"

// Basic operations
show call math.abs(-5)         // 5
show call math.sqrt(16)        // 4
show call math.pow(2, 8)       // 256
show call math.floor(3.7)      // 3
show call math.ceil(3.2)       // 4
show call math.round(3.5)      // 4

// Trigonometry
show call math.sin(1.57)       // ~1 (PI/2)
show call math.cos(0)          // 1
show call math.tan(0.78)       // ~1 (PI/4)

// Random numbers
show call math.random()        // 0.0 to 1.0
show call math.seed(42)        // Sets the seed for the RNG
show call math.randint(1, 10)  // Random integer 1-10 (inclusive)
show call math.clamp(15, 0, 10) // 10
show call math.lerp(10, 20, 0.5) // 15
show call math.sum([1, 2, 3])  // 6
show call math.mean([2, 4, 6]) // 4

// Constants
show math.PI                 // 3.14159...
show math.E                  // 2.71828...
```

## String Module

```mimo
import string from "string"

// String operations
show len "hello"                           // 5
show call string.to_upper("hello")         // "HELLO"
show call string.to_lower("WORLD")         // "world"
show call string.to_title_case("hi all")   // "Hi All"
show call string.capitalize("mimo")        // "Mimo"
show call string.trim("  hi  ")            // "hi"

// Substring
show call string.substring("hello", 1, 4) // "ell"
show call string.slice("hello", 0, 3)     // "hel"

// Search and replace
show call string.contains("hello", "ll")      // true
show call string.starts_with("hello", "he")   // true
show call string.ends_with("hello", "lo")     // true
show call string.index_of("hello", "l")       // 2
show call string.replace("hello", "l", "r")   // "herro"
show call string.replace_all("a-b-a", "a", "x") // "x-b-x"
show call string.repeat("ha", 3)              // "hahaha"
show call string.pad_start("7", 3, "0")       // "007"
show call string.pad_end("mimo", 6, "!")      // "mimo!!"
show call string.is_empty("")                 // true
show call string.is_blank("   ")              // true

// Split and join
set parts call string.split("a,b,c", ",")
show parts  // ["a", "b", "c"]
show call join(parts, "-")  // "a-b-c"
```

## Array Module

```mimo
import array from "array"

set numbers [1, 2, 3, 4, 5]

// Array operations
show call array.first(numbers)        // 1
show call array.last(numbers)         // 5
show call array.is_empty(numbers)     // false

// Modification (returns new array)
show call array.reverse(numbers)      // [5, 4, 3, 2, 1]
show call array.sort(numbers)         // [1, 2, 3, 4, 5]
show call array.shuffle(numbers)      // Randomly shuffled
show call array.unique(numbers)       // Array with unique elements

// Higher-order functions
set doubled call array.map(numbers, (fn x -> * 2 x))
show doubled  // [2, 4, 6, 8, 10]

set evens call array.filter(numbers, (fn x -> = (% x 2) 0))
show evens  // [2, 4]

// Search
show call array.includes(numbers, 3)            // true
show call array.index_of(numbers, 3)            // 2
show call array.find(numbers, (fn x -> > x 3))  // 4

// Set Operations
set a1 [1, 2, 3]
set a2 [3, 4, 5]
show call array.intersection(a1, a2)   // [3]
show call array.union(a1, a2)          // [1, 2, 3, 4, 5]
show call array.difference(a1, a2)     // [1, 2]
show call array.flat([1, [2, [3]], 4], 2) // [1, 2, 3, 4]
show call array.flat_map(numbers, (fn x -> [x, * x 10]))
show call array.group_by(numbers, (fn x -> if = (% x 2) 0 then "even" else "odd" end))
show call array.zip([1, 2], ["a", "b"]) // [[1, "a"], [2, "b"]]
show call array.chunk(numbers, 2)        // [[1, 2], [3, 4], [5]]
show call array.count(numbers)           // 5
show call array.count(numbers, (fn x -> > x 3)) // 2
```

## Object Module

```mimo
import object from "object"

set user { name: "Ada", age: 30, role: "admin" }

show call object.merge({ name: "Ada" }, { active: true }) // {name: "Ada", active: true}
show call object.pick(user, ["name", "role"])             // {name: "Ada", role: "admin"}
show call object.omit(user, ["age"])                      // {name: "Ada", role: "admin"}
show call object.map_values({ a: 1, b: 2 }, (fn v -> * v 10)) // {a: 10, b: 20}
show call object.from_entries([["x", 1], ["y", 2]])     // {x: 1, y: 2}
show call object.is_empty({})                            // true
```

## Built-in Functions

```mimo
// Built-in functions are available without import

// Length
show len "hello"           // 5
show len [1, 2, 3]         // 3

// Get/update
show get [1, 2, 3] 1       // 2
show get { name: "A" } "name"  // "A"

// Type checking
show type 42               // "number"
show type "hello"          // "string"
show type [1, 2]           // "array"
show type { a: 1 }         // "object"

// Object utilities
show keys { a: 1, b: 2 }   // ["a", "b"]
show values { a: 1, b: 2 } // [1, 2]
show entries { a: 1 }      // [["a", 1]]
show has_property obj "key"  // true/false

// Range
for i in range 0 5
    show i  // 0, 1, 2, 3, 4
end
```

## File System Module (Node.js)

```mimo
import fs from "fs"

// Read file
set content call fs.read_file("file.txt")
show content

// Write file
call fs.write_file("output.txt", "Hello, World!")

// Check if file exists
if call fs.exists("file.txt")
    show "File exists"
end

// List directory
set files call fs.list_dir(".")
for file in files
    show file
end
```

## HTTP Module

```mimo
import http from "http"

// GET request
set response call http.get("https://api.example.com/data")
show response.status  // 200
show response.body    // Response body as string

// POST request
set response call http.post(
    "https://api.example.com/create",
    call json.stringify({ name: "Alice" }),
    { "Content-Type": "application/json" },
)
show response.status
```

## JSON Module

```mimo
import json from "json"

// Parse JSON string
set data call json.parse("{\"name\": \"Alice\", \"age\": 30}")
show data.name  // "Alice"

// Stringify object
set obj { name: "Bob", age: 25 }
set json_string call json.stringify(obj)
show json_string  // {"name":"Bob","age":25}
```

## Regex Module

```mimo
import regex from "regex"

// Test match
show call regex.is_match("^[a-z]+$", "hello")    // true
show call regex.is_match("^[a-z]+$", "Hello")    // false

// Find matches
set text "The year is 2024"
set numbers call regex.find_matches("\\d+", text)
show numbers  // ["2024"]

// Replace
set result call regex.replace_all("hello world", "world", "Mimo")
show result  // "hello Mimo"
```

## DateTime Module

```mimo
import datetime from "datetime"

// Current time
set now call datetime.now()
show now  // Unix timestamp

// ISO format
set iso call datetime.to_iso_string(now)
show iso

// Format date
set formatted call datetime.format(now, "YYYY-MM-DD")
show formatted  // "2024-01-15"
```

## Path Module

```mimo
import path from "path"

show call path.join("src", "lib", "main.mimo")
show call path.dirname("/tmp/file.txt")
show call path.basename("/tmp/file.txt")
show call path.extname("/tmp/file.txt")
```

## Env Module

```mimo
import env from "env"

show call env.has("HOME")
show call env.get("HOME")
show call env.get("NOT_SET", "fallback")
set vars call env.all()
show type vars // "object"
```
