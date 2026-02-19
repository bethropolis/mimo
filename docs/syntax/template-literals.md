# Template Literals

Template literals are strings enclosed in backticks (` `) that support multi-line text and embedded expressions via `${...}` interpolation.

## Basic Interpolation

```mimo
// Embed variables
set name "Alice"
set greeting `Hello, ${name}!`
show greeting  // "Hello, Alice!"

// Embed expressions
set count 5
set message `You have ${count} items`
show message  // "You have 5 items"

// Calculations in templates
set price 10
set qty 3
set total `Total: ${* price qty}`  // "Total: 30"
show total
```

## Multi-line Strings

```mimo
// Template literals preserve line breaks
set poem `Roses are red,
Violets are blue,
Mimo is awesome,
And so are you!`
show poem
```

## Expression Interpolation

```mimo
// Any expression can be interpolated
set a 10
set b 20
set result `Sum: ${+ a b}, Product: ${* a b}`
show result  // "Sum: 30, Product: 200"

// Function calls
function get_status()
    return "active"
end
set status `Status: ${call get_status()}`
show status  // "Status: active"
```

## Object and Array Access

```mimo
// Object property access
set user { name: "Bob", age: 25 }
set info `User: ${user.name}, Age: ${user.age}`
show info  // "User: Bob, Age: 25"

// Array access
set items [10, 20, 30]
set first `First item: ${items[0]}`
show first  // "First item: 10"
```

## Escaping

```mimo
// Literal dollar sign with backslash
set text `Price: $${100}`
show text  // "Price: $100"

// Literal backtick
set quote `He said: \`Hello\``
show quote  // "He said: `Hello`"
```

## Complex Examples

```mimo
// Combined with object properties
set product { name: "Laptop", price: 999, inStock: true }
set label `${product.name}: $${product.price}`
show label  // "Laptop: $999"

// Nested templates via function
function format_price(amount)
    return `$${amount}`
end
set receipt `Total: ${call format_price(42)}`
show receipt  // "Total: $42"

// Boolean and null values
set active true
set disabled false
set empty null
set flags `Active: ${active}, Disabled: ${disabled}, Empty: ${empty}`
show flags  // "Active: true, Disabled: false, Empty: null"
```

## Empty Templates

```mimo
// Empty template
set empty ``
show + "Length:" (len empty)  // "Length: 0"

// Only expression
set expr `${+ 10 20}`
show expr  // "30"
```

## Comparison with String Concatenation

```mimo
// Template literal (cleaner)
set name "World"
set greeting `Hello, ${name}!`

// String concatenation (alternative)
set greeting + "Hello, " + name + "!"
```
