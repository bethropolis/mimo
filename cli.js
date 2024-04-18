#!/usr/bin/env node

import fs from "fs";
import path from "path";
import Mimo from "./index.js";

// Get the directory of the current script
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Read the package.json file
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "package.json"), "utf-8")
);
const { version } = packageJson;

// Check if the user asked for the version
if (process.argv.includes("-v") || process.argv.includes("--version")) {
  console.log(version);
  process.exit(0);
}

// Check if the user asked for help
if (process.argv.includes("-h") || process.argv.includes("--help")) {
  console.log("Usage: mimo [FILENAME] [-o|--output] [-t|--time] [-h|--help] [-q|--quiet] [-d|--debug] [-v|--version]");
  console.log("FILENAME: The file to process.");
  console.log("-o, --output: Generate output file.");
  console.log("-t, --time: Measure execution time.");
  console.log("-h, --help: Show this help message.");
  console.log("-q, --quiet: Suppress all non-essential output.");
  console.log("-d, --debug: Display additional debug information.");
  console.log("-v, --version: Display the version number.");
  process.exit(0);
}

// Check if a filename was provided
if (process.argv.length < 3) {
  console.error("Error: No file name provided.\n");
  console.log("Usage: mimo [FILENAME] [-o|--output] [-t|--time] [-h|--help] [-q|--quiet] [-d|--debug] [-v|--version]");
  console.log("Use the --help flag for more information.\n\n");
  process.exit(1);
}

const filename = process.argv[2];
const shouldGenerateOutput = process.argv.includes("-o") || process.argv.includes("--output");
const shouldMeasureTime = process.argv.includes("-t") || process.argv.includes("--time");
const shouldSuppressOutput = process.argv.includes("-q") || process.argv.includes("--quiet");
const shouldDisplayDebugInfo = process.argv.includes("-d") || process.argv.includes("--debug");

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
  if (shouldMeasureTime) console.time("Execution time");
  
  let { program } = await mimo.run(code);

  if (shouldMeasureTime) console.timeEnd("Execution time");

  if (shouldGenerateOutput) {
    const outputFilename = path.join(
      path.dirname(filename),
      path.basename(filename, path.extname(filename)) + ".js"
    );
    fs.writeFileSync(outputFilename, mimo.toJS(program), "utf-8");
    if (!shouldSuppressOutput) console.log(`Output written to: ${outputFilename}`);
  }
} catch (err) {
  if (shouldDisplayDebugInfo) console.error("Error running code:", err);
  process.exit(1);
}