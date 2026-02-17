const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function compileRegexPattern(value, label) {
  if (typeof value !== "string") {
    return;
  }
  try {
    new RegExp(value);
  } catch (error) {
    throw new Error(`invalid regex in ${label}: ${error.message}`);
  }
}

function walkGrammar(pattern, prefix) {
  compileRegexPattern(pattern.match, `${prefix}.match`);
  compileRegexPattern(pattern.begin, `${prefix}.begin`);
  compileRegexPattern(pattern.end, `${prefix}.end`);

  if (Array.isArray(pattern.patterns)) {
    pattern.patterns.forEach((child, index) => walkGrammar(child, `${prefix}.patterns[${index}]`));
  }
}

function main() {
  const grammarPath = path.join(root, "syntaxes/mimo.tmLanguage.json");
  const grammar = JSON.parse(fs.readFileSync(grammarPath, "utf8"));
  assert(Array.isArray(grammar.patterns), "grammar patterns must be an array");
  grammar.patterns.forEach((pattern, index) => walkGrammar(pattern, `patterns[${index}]`));

  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const activationEvents = pkg.activationEvents || [];
  assert(activationEvents.includes("onLanguage:mimo"), "missing activation event onLanguage:mimo");
  assert(activationEvents.includes("onCommand:mimo.runFile"), "missing activation event onCommand:mimo.runFile");

  console.log("smoke-test: ok");
}

try {
  main();
} catch (error) {
  console.error(`smoke-test: failed - ${error.message}`);
  process.exit(1);
}
