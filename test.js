#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { nodeAdapter as adapter } from './adapters/nodeAdapter.js';
import { Mimo } from './index.js';


async function runTest() {
    const testName = process.argv[2] || 'all';
    const filePath = findTestFile(testName);

    if (!filePath) {
        console.error(`Error: Test file "${testName}" not found.`);
        return;
    }

    console.log(`\n=== Running Test: ${path.basename(filePath)} ===\n`);

    const source = fs.readFileSync(filePath, 'utf-8');
    const mimo = new Mimo(adapter);

    try {
        mimo.run(source, filePath);
        console.log(`\n=== Test Passed: ${path.basename(filePath)} ===\n`);
    } catch (err) {
        console.error(err.message || err); // Show error even if it's a string
        console.error(`\n=== Test FAILED: ${path.basename(filePath)} ===\n`);
        process.exit(1);
    }
}


function findTestFile(fileName) {
    const directPath = path.resolve(process.cwd(), fileName);
    if (fs.existsSync(directPath)) return directPath;

    const withExt = directPath.endsWith('.mimo') ? '' : '.mimo';
    if (fs.existsSync(`${directPath}${withExt}`)) return `${directPath}${withExt}`;

    const testSourcePath = path.resolve(process.cwd(), 'test/source', fileName);
    if (fs.existsSync(testSourcePath)) return testSourcePath;
    if (fs.existsSync(`${testSourcePath}.mimo`)) return `${testSourcePath}.mimo`;

    return null;
}

runTest();
