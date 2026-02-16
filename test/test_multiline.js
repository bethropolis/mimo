#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const replPath = join(__dirname, '..', 'repl.js');

console.log('Testing Multi-line REPL functionality...');

const repl = spawn('node', [replPath], {
    stdio: ['pipe', 'pipe', 'pipe']
});

const testCommands = [
    'show "=== Testing Multi-line Input ==="',
    'function add(a, b)',
    '    return + a b',
    'end',
    'call add(5, 3) -> sum',
    'sum',
    'if (> sum 5)',
    '    show "Sum is greater than 5"',
    'else',
    '    show "Sum is 5 or less"',
    'end',
    'exit'
];

let output = '';
let currentTest = 0;
let waitingForPrompt = true;

repl.stdout.on('data', (data) => {
    const str = data.toString();
    output += str;
    console.log('REPL:', str.replace(/\n$/, ''));
    
    if ((str.includes('mimo>') || str.includes('....>')) && currentTest < testCommands.length && waitingForPrompt) {
        waitingForPrompt = false;
        setTimeout(() => {
            if (currentTest < testCommands.length && !repl.killed) {
                console.log(`[${currentTest + 1}/${testCommands.length}] Sending:`, testCommands[currentTest]);
                repl.stdin.write(testCommands[currentTest] + '\n');
                currentTest++;
                waitingForPrompt = true;
            }
        }, 300);
    }
});

repl.stderr.on('data', (data) => {
    const errorStr = data.toString();
    console.log('REPL Error:', errorStr.replace(/\n$/, ''));
    waitingForPrompt = true;
});

repl.on('close', (code) => {
    console.log(`\n=== Multi-line Test Complete ===`);
    console.log(`Exit code: ${code}`);
    console.log(`Tests executed: ${currentTest}/${testCommands.length}`);
    
    if (code === 0 && currentTest === testCommands.length) {
        console.log('✅ Multi-line REPL tests passed!');
    } else {
        console.log('❌ Multi-line tests failed');
    }
    
    process.exit(code);
});

repl.on('error', (err) => {
    console.error('Failed to start REPL:', err);
    process.exit(1);
});

setTimeout(() => {
    if (currentTest < testCommands.length && !repl.killed) {
        console.log(`[${currentTest + 1}/${testCommands.length}] Sending:`, testCommands[currentTest]);
        repl.stdin.write(testCommands[currentTest] + '\n');
        currentTest++;
    }
}, 1000);

setTimeout(() => {
    if (!repl.killed) {
        console.log('\n⚠️  Test timeout - forcing exit');
        repl.kill();
        process.exit(1);
    }
}, 20000);