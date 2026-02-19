const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function readJson(relPath) {
  const file = path.join(root, relPath);
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const pkg = readJson("package.json");
  const grammar = readJson("syntaxes/mimo.tmLanguage.json");
  const langConfig = readJson("language-configuration.json");
  const snippets = readJson("snippets.json");

  assert(pkg.name === "mimo-vscode", "package name must be mimo-vscode");
  assert(pkg.main, "package.json main field is required");
  assert(fs.existsSync(path.join(root, pkg.main)), `main file not found: ${pkg.main}`);

  const language = pkg.contributes?.languages?.find((l) => l.id === "mimo");
  assert(language, "missing mimo language contribution");
  assert(Array.isArray(language.extensions) && language.extensions.includes(".mimo"), "mimo language must include .mimo extension");

  const grammarContribution = pkg.contributes?.grammars?.find((g) => g.language === "mimo");
  assert(grammarContribution, "missing mimo grammar contribution");
  assert(grammar.scopeName === "source.mimo", "grammar scopeName should be source.mimo");
  assert(Array.isArray(grammar.patterns), "grammar patterns must be an array");

  assert(langConfig.comments?.lineComment === "//", "line comment should be //");
  assert(typeof snippets === "object" && snippets !== null, "snippets.json must be a JSON object");

  const commandId = "mimo.runFile";
  const command = pkg.contributes?.commands?.find((c) => c.command === commandId);
  assert(command, `missing command contribution: ${commandId}`);

  const extensionSource = fs.readFileSync(path.join(root, "src/extension.js"), "utf8");
  assert(extensionSource.includes(`registerCommand("${commandId}"`), `command ${commandId} is not registered in src/extension.js`);

  console.log("validate: ok");
}

try {
  main();
} catch (error) {
  console.error(`validate: failed - ${error.message}`);
  process.exit(1);
}
