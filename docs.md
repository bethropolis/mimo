# Mimo Language Documentation

## Introduction
This documentation provides an overview of the syntax and usage of mimo.

## Syntax
The syntax of mimo language follows a structured format with keywords and expressions for defining functions, variables, control flow, and more.


### Variables

Variables are declared using the `set` keyword followed by the variable name and its value. For example:
```
set variable_name value

set age 25
set name "John Doe"
```


### Functions
Functions are defined using the `function` keyword followed by the function name and parameters. The function body is enclosed within `endfunction`.

```
function function_name(param1, param2, ...)
    // Function body
endfunction
```

### Function Calls
Functions can be called using the call keyword, and the result can be assigned to a variable using the -> operator.
```
call function_name(param1, param2, ...) -> result_variable
```

### Control Flow
The language supports conditional statements (if, endif) and loops (while, endwhile).
```
if condition
    // Code block
endif

while condition
    // Code block
endwhile

```

### Show Output
The show keyword is used to output variables or strings to the console.
```
show variable_name
show "String"
```

## example


```
function add(a,b)
  return + a b
endfunction

set x 5
set y 2

call add(x,y) -> result
show result
```

more example in the [test directory]('./test/mimo/')