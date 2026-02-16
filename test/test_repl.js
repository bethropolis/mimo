#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const replPath = join(__dirname, '..', 'repl.js');

console.log('Testing Mimo REPL...');

const repl = spawn('node', [replPath], {
    stdio: ['pipe', 'pipe', 'pipe']
});

const testCommands = [
    'show "Hello REPL!"',
    'set x 10',
    'show x',
    '+ x 5',
    'let y * x 2',
    'y',
    'set arr [1, 2, 3]',
    'arr',
    'call len(arr)',
    'exit'
];

let output = '';
let currentTest = 0;

repl.stdout.on('data', (data) => {
    const str = data.toString();
    output += str;
    console.log('REPL Output:', str.trim());
    
    // Send next command after seeing prompt
    if (str.includes('mimo>') && currentTest < testCommands.length && !repl.killed) {
        setTimeout(() => {
            if (currentTest < testCommands.length && !repl.killed) {
                console.log('Sending command:', testCommands[currentTest]);
                repl.stdin.write(testCommands[currentTest] + '\n');
                currentTest++;
            }
        }, 100);
    }
});

repl.stderr.on('data', (data) => {
    console.log('REPL Error:', data.toString().trim());
});

repl.on('close', (code) => {
    console.log(`\nREPL exited with code ${code}`);
    console.log('\nFull output:', output);
    process.exit(code);
});

// Stop sending commands when REPL exits
repl.on('exit', () => {
    currentTest = testCommands.length;
});

repl.on('error', (err) => {
    console.error('Failed to start REPL:', err);
    process.exit(1);
});

// Start by waiting for initial prompt
setTimeout(() => {
    if (currentTest < testCommands.length && !repl.killed) {
        console.log('Sending first command:', testCommands[currentTest]);
        repl.stdin.write(testCommands[currentTest] + '\n');
        currentTest++;
    }
}, 1000);