#!/usr/bin/env node

import fs from "fs";
import Mimo from "./index.js";
import { version } from "./package.json";

// Check if the user asked for the version
if (process.argv.includes("-v") || process.argv.includes("--version")) {
  console.log(version);
  process.exit(0);
}

// Check if a filename was provided
if (process.argv.length < 3) {
  console.error("Error: No file name provided.");
  console.log("Usage: mimo [FILENAME]");
  process.exit(1);
}

const filename = process.argv[2];

// Check if the file exists
if (!fs.existsSync(filename)) {
  console.error(`Error: File '${filename}' does not exist.`);
  process.exit(1);
}

// Read the file
let code;
try {
  code = fs.readFileSync(filename, "utf-8");
} catch (err) {
  console.error(`Error reading file '${filename}':`, err.message);
  process.exit(1);
}

// Run the code
const mimo = new Mimo();
try {
  mimo.run(code);
} catch (err) {
  console.error("Error running code:", err.message);
  process.exit(1);
}
