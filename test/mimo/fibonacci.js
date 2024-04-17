function fibonacci(n) {
  if (n <= 1) {
    return n;
  }
  let a = 0;
  let b = 1;
  let i = 2;
  while (i <= n) {
    let temp = add(a, b);
    a = b;
    b = temp;
    i = i + 1;
  }
  return b;
}
function add(x, y) {
  return x + y;
}
let number = 10;
let fib = fibonacci(number);
console.log(fib);