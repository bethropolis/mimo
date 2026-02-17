#!/usr/bin/env bun
import fs from "node:fs";
import path from "node:path";
import { nodeAdapter } from "../adapters/nodeAdapter.js";
import { Mimo } from "../index.js";
import { runRepl } from "../repl.js";
import { formatFile } from "../tools/formatter.js";
import { lintFile } from "../tools/linter.js";

// --- Helper Functions ---
function getVersion() {
  const packageJsonPath = path.resolve(
    path.dirname(import.meta.url.replace("file://", "")),
    "../package.json",
  );
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  return packageJson.version;
}

function showHelp() {
  console.log(`
Mimo Language Toolkit v${getVersion()}

Usage: mimo <command> [options]

Commands:
  <file>            Run a Mimo file. (e.g., mimo examples/hello.mimo)
  run <file>        Explicitly run a Mimo file.
  repl              Start the Mimo Read-Eval-Print-Loop.
  fmt <paths>...    Format .mimo files from files/directories.
                    Flags: --write, --check, --quiet
  lint <paths>...   Statically analyze .mimo files from files/directories.
                    Flags: --fail-on-warning, --quiet
  test [path]       Run test files. Defaults to current directory.

Options:
  --version, -v     Show the version number.
  --help, -h        Show this help message.
  --eval, -e <code> Evaluate a string of Mimo code.
  -                 Read and execute Mimo code from STDIN.
    `);
}

async function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
  });
}

function collectMimoFiles(targets) {
  const resolvedTargets = targets.length === 0 ? ["."] : targets;
  const seen = new Set();
  const files = [];

  function visit(targetPath) {
    const absolutePath = path.resolve(process.cwd(), targetPath);
    if (!fs.existsSync(absolutePath)) {
      console.error(`Warning: Path not found: ${targetPath}`);
      return;
    }

    const stat = fs.statSync(absolutePath);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(absolutePath)) {
        visit(path.join(absolutePath, entry));
      }
      return;
    }

    if (!absolutePath.endsWith(".mimo")) {
      return;
    }

    if (!seen.has(absolutePath)) {
      seen.add(absolutePath);
      files.push(absolutePath);
    }
  }

  for (const target of resolvedTargets) {
    visit(target);
  }

  return files;
}

// --- New Test Runner Logic ---
function getAllTestFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllTestFiles(filePath, fileList);
    } else {
      // Look for .test.mimo OR just .mimo files in a 'test' folder
      if (
        file.endsWith(".mimo") &&
        (file.includes(".test.") || dir.includes("test"))
      ) {
        fileList.push(filePath);
      }
    }
  });
  return fileList;
}

async function runTests(targetPath) {
  console.log("\n🚀 Mimo Test Runner\n");

  const absoluteTarget = path.resolve(process.cwd(), targetPath || ".");
  let filesToTest = [];

  if (fs.existsSync(absoluteTarget) && fs.statSync(absoluteTarget).isFile()) {
    filesToTest.push(absoluteTarget);
  } else if (
    fs.existsSync(absoluteTarget) &&
    fs.statSync(absoluteTarget).isDirectory()
  ) {
    filesToTest = getAllTestFiles(absoluteTarget);
  } else {
    console.error(`Error: Path '${targetPath}' not found.`);
    return;
  }

  if (filesToTest.length === 0) {
    console.log("No test files found.");
    return;
  }

  let passed = 0;
  let failed = 0;
  const startTime = Date.now();

  for (const file of filesToTest) {
    const relativeName = path.relative(process.cwd(), file);
    process.stdout.write(`Running ${relativeName} ... `);

    const source = fs.readFileSync(file, "utf-8");

    // Capture logs during test execution so valid tests don't spam console
    const logs = [];
    const testAdapter = {
      ...nodeAdapter,
      log: (...args) => logs.push(args.join(" ")),
      error: (...args) => logs.push("[ERROR] " + args.join(" ")),
    };

    const mimo = new Mimo(testAdapter);

    try {
      mimo.run(source, file);
      console.log("\x1b[32mPASS\x1b[0m"); // Green PASS
      passed++;
    } catch (err) {
      console.log("\x1b[31mFAIL\x1b[0m"); // Red FAIL
      failed++;
      console.log("\n--- Output ---");
      if (logs.length > 0) console.log(logs.join("\n"));
      console.log("--- Error ---");
      console.log(err); // err is likely a string formatted by Mimo.run
      console.log("-------------\n");
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `\nTest Result: ${passed} passed, ${failed} failed. (Time: ${duration}s)`,
  );

  if (failed > 0) process.exit(1);
}

// --- Main CLI Logic ---
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  switch (command) {
    case "--version":
    case "-v":
      console.log(getVersion());
      break;
    case "--help":
    case "-h":
      showHelp();
      break;
    case "repl":
      runRepl();
      break;
    case "fmt": {
      const shouldWrite = commandArgs.includes("--write");
      const shouldCheck = commandArgs.includes("--check");
      const quiet = commandArgs.includes("--quiet");
      const targets = commandArgs.filter((arg) => !arg.startsWith("--"));
      const filesToFormat = collectMimoFiles(targets);

      if (filesToFormat.length === 0) {
        console.error("Error: No .mimo files found for formatting.");
        process.exit(1);
      }

      let hadErrors = false;
      let hadUnformatted = false;

      for (const file of filesToFormat) {
        const result = formatFile(file, {
          write: shouldWrite,
          check: shouldCheck,
          quiet,
        });
        if (!result.ok) hadErrors = true;
        if (shouldCheck && result.changed) hadUnformatted = true;
      }

      if (hadErrors || hadUnformatted) {
        process.exit(1);
      }
      break;
    }
    case "lint": {
      const quiet = commandArgs.includes("--quiet");
      const failOnWarning = commandArgs.includes("--fail-on-warning");
      const targets = commandArgs.filter((arg) => !arg.startsWith("--"));
      const filesToLint = collectMimoFiles(targets);

      if (filesToLint.length === 0) {
        console.error("Error: No .mimo files found for linting.");
        process.exit(1);
      }

      let hadErrors = false;
      let warnings = 0;

      for (const file of filesToLint) {
        const result = lintFile(file, { quiet });
        if (!result.ok) {
          hadErrors = true;
          continue;
        }
        warnings += result.messages.length;
      }

      if (hadErrors || (failOnWarning && warnings > 0)) {
        process.exit(1);
      }
      break;
    }

    // --- NEW TEST COMMAND ---
    case "test": {
      const target = commandArgs[0] || "."; // Default to current dir
      await runTests(target);
      break;
    }

    case "--eval":
    case "-e": {
      const code = commandArgs[0];
      if (!code) {
        console.error("Error: No code provided to evaluate.");
        process.exit(1);
      }
      const mimo = new Mimo(nodeAdapter);
      try {
        const result = mimo.run(code, "/eval");
        if (result !== undefined && result !== null) {
          console.log(result);
        }
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
      break;
    }

    case "-": {
      const source = await readStdin();
      const mimo = new Mimo(nodeAdapter);
      try {
        mimo.run(source, "/stdin");
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
      break;
    }

    case "run":
    default: {
      const filePath = command === "run" ? commandArgs[0] : command;

      // If no file and stdin is not a TTY, read from stdin
      if (!filePath && !process.stdin.isTTY) {
        const source = await readStdin();
        const mimo = new Mimo(nodeAdapter);
        try {
          mimo.run(source, "/stdin");
        } catch (err) {
          console.error(err);
          process.exit(1);
        }
        return;
      }

      if (!filePath) {
        if (command === "run") {
          console.error("Error: No file specified to run.");
        } else {
          showHelp();
        }
        return;
      }

      const absolutePath = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(absolutePath)) {
        console.error(`Error: File not found at '${absolutePath}'`);
        return;
      }

      const source = fs.readFileSync(absolutePath, "utf-8");
      const mimo = new Mimo(nodeAdapter);

      try {
        mimo.run(source, absolutePath);
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
      break;
    }
  }
}

main().catch((err) => {
  console.error("An unexpected error occurred in the Mimo CLI:", err);
  process.exit(1);
});
