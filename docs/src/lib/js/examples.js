let ADD = `function add(a,b)
return + a b
endfunction

set x 5
set y 2

call add(x,y) -> result
show result`;



let FIB = `function fibonacci(n)
if <= n 1
    return n
endif
set a 0
set b 1
set i 2
while <= i n
    call add(a, b) -> temp
    set a b
    set b temp
    set i + i 1
endwhile
return b
endfunction

function add(x, y)
return + x y
endfunction

set number 10
call fibonacci(number) -> fib
show fib`;


let SYNTAX = `set x 10
set y 20
if > x y
	show "x is greater than y"
else
    show "x is not greater than y"
endif

set i 0
while < i 5
    show i
    set i + i 1
endwhile

function add(a, b)
    return + a b
endfunction

set x 10
set y 20
call add(x, y) -> sum
show sum

set fruits ["apple", "banana", "orange"]
show fruits[1]`



export const code = [
    {name: 'Add', code: ADD},
    {name: 'Fibonacci', code: FIB},
    {name: 'Syntax', code: SYNTAX}
]

