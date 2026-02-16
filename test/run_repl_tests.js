#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Running Mimo REPL Test Suite...\n');

const testFiles = [
    'test_repl.js',
    'test_repl_advanced.js',
    'test_multiline.js'
];

let passedTests = 0;
let totalTests = testFiles.length;

async function runTest(testFile) {
    return new Promise((resolve) => {
        console.log(`▶️  Running ${testFile}...`);
        
        const testProcess = spawn('node', [join(__dirname, testFile)], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        testProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        testProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        testProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${testFile} - PASSED\n`);
                passedTests++;
            } else {
                console.log(`❌ ${testFile} - FAILED (exit code: ${code})`);
                if (errorOutput) {
                    console.log('Error output:', errorOutput);
                }
                console.log('');
            }
            resolve(code);
        });

        testProcess.on('error', (err) => {
            console.log(`❌ ${testFile} - ERROR: ${err.message}\n`);
            resolve(1);
        });

        // Timeout safety
        setTimeout(() => {
            if (!testProcess.killed) {
                console.log(`⚠️  ${testFile} - TIMEOUT, killing process\n`);
                testProcess.kill();
                resolve(1);
            }
        }, 30000);
    });
}

async function runAllTests() {
    for (const testFile of testFiles) {
        await runTest(testFile);
    }

    console.log('═══════════════════════════════════════');
    console.log(`📊 Test Results: ${passedTests}/${totalTests} passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All REPL tests passed successfully!');
        process.exit(0);
    } else {
        console.log('💥 Some REPL tests failed');
        process.exit(1);
    }
}

runAllTests().catch((err) => {
    console.error('Test runner error:', err);
    process.exit(1);
});