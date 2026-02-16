#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const replPath = join(__dirname, '..', 'repl.js');

console.log('Testing Advanced Mimo REPL Features...');

const repl = spawn('node', [replPath], {
    stdio: ['pipe', 'pipe', 'pipe']
});

const testCommands = [
    // Basic expressions
    'show "=== Testing Basic REPL ==="',
    'set x 42',
    'x',
    '+ x 8',
    '* x 2',
    
    // Variables and assignments
    'let result - x 10',
    'result',
    
    // Arrays and operations
    'set numbers [1, 2, 3, 4, 5]',
    'numbers',
    'call len(numbers)',
    'numbers[2]',
    
    // String operations
    'set greeting "Hello REPL"',
    'greeting',
    'call upper(greeting)',
    
    // Math operations
    'call range(1, 5)',
    '(> x 40) ? "large" : "small"',
    
    // Object literals
    'set person { name: "Alice", age: 30 }',
    'person',
    'person.name',
    
    // Built-in function calls
    'call type(x)',
    'call type(numbers)',
    'call type(person)',
    
    // Complex expressions
    '+ (* 3 4) (/ 20 4)',
    '(= (+ 2 3) 5) ? "correct" : "wrong"',
    
    // Variable updates
    'set x + x 1',
    'x',
    
    'exit'
];

let output = '';
let currentTest = 0;
let waitingForPrompt = true;

repl.stdout.on('data', (data) => {
    const str = data.toString();
    output += str;
    console.log('REPL:', str.replace(/\n$/, ''));
    
    // Send next command after seeing prompt
    if ((str.includes('mimo>') || str.includes('....>')) && currentTest < testCommands.length && waitingForPrompt) {
        waitingForPrompt = false;
        setTimeout(() => {
            if (currentTest < testCommands.length && !repl.killed) {
                console.log(`[${currentTest + 1}/${testCommands.length}] Sending:`, testCommands[currentTest]);
                repl.stdin.write(testCommands[currentTest] + '\n');
                currentTest++;
                waitingForPrompt = true;
            }
        }, 200);
    }
});

repl.stderr.on('data', (data) => {
    const errorStr = data.toString();
    console.log('REPL Error:', errorStr.replace(/\n$/, ''));
    waitingForPrompt = true;
});

repl.on('close', (code) => {
    console.log(`\n=== REPL Test Complete ===`);
    console.log(`Exit code: ${code}`);
    console.log(`Tests executed: ${currentTest}/${testCommands.length}`);
    
    if (code === 0 && currentTest === testCommands.length) {
        console.log('✅ All REPL tests passed successfully!');
    } else {
        console.log('❌ Some tests failed or incomplete');
    }
    
    process.exit(code);
});

repl.on('error', (err) => {
    console.error('Failed to start REPL:', err);
    process.exit(1);
});

// Start the test sequence
setTimeout(() => {
    if (currentTest < testCommands.length && !repl.killed) {
        console.log(`[${currentTest + 1}/${testCommands.length}] Sending:`, testCommands[currentTest]);
        repl.stdin.write(testCommands[currentTest] + '\n');
        currentTest++;
    }
}, 1000);

// Timeout safety
setTimeout(() => {
    if (!repl.killed) {
        console.log('\n⚠️  Test timeout - forcing exit');
        repl.kill();
        process.exit(1);
    }
}, 30000);