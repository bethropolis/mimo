const vscode = require("vscode");
const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

let outputChannel;
let statusBar;
let diagnosticCollection;
let lintTimeouts = new Map();

const KEYWORDS = [
    { name: "set", doc: "Declare or update a mutable variable" },
    { name: "let", doc: "Declare a block-scoped variable" },
    { name: "const", doc: "Declare an immutable constant" },
    { name: "global", doc: "Declare a global variable" },
    { name: "if", doc: "Conditional statement" },
    { name: "elif", doc: "Else-if clause in conditional" },
    { name: "else", doc: "Else clause in conditional" },
    { name: "while", doc: "While loop" },
    { name: "for", doc: "For-in loop" },
    { name: "in", doc: "Keyword for iteration" },
    { name: "match", doc: "Pattern matching expression" },
    { name: "case", doc: "Case clause in match" },
    { name: "default", doc: "Default clause in match" },
    { name: "break", doc: "Exit from loop" },
    { name: "continue", doc: "Skip to next iteration" },
    { name: "function", doc: "Define a function" },
    { name: "call", doc: "Call a function" },
    { name: "return", doc: "Return from function" },
    { name: "try", doc: "Try block for error handling" },
    { name: "catch", doc: "Catch block for error handling" },
    { name: "throw", doc: "Throw an error" },
    { name: "import", doc: "Import a module" },
    { name: "export", doc: "Export from module" },
    { name: "from", doc: "Module source keyword" },
    { name: "as", doc: "Alias keyword" },
    { name: "show", doc: "Print a value to output" },
    { name: "end", doc: "End a block" },
];

const BUILTINS = [
    { name: "len", doc: "Get length of string or array" },
    { name: "get", doc: "Get element from array or property from object" },
    { name: "update", doc: "Update element in array or property in object" },
    { name: "type", doc: "Get type of a value" },
    { name: "push", doc: "Add element to end of array" },
    { name: "pop", doc: "Remove and return last element of array" },
    { name: "slice", doc: "Extract portion of array" },
    { name: "range", doc: "Create array of numbers in range" },
    { name: "join", doc: "Join array elements into string" },
    { name: "has_property", doc: "Check if object has property" },
    { name: "keys", doc: "Get keys of object" },
    { name: "values", doc: "Get values of object" },
    { name: "entries", doc: "Get key-value pairs of object" },
    { name: "get_arguments", doc: "Get command line arguments" },
    { name: "get_env", doc: "Get environment variable" },
    { name: "exit_code", doc: "Set exit code" },
    { name: "coalesce", doc: "Return first non-null value" },
    { name: "get_property_safe", doc: "Safely get property (null-safe)" },
    { name: "if_else", doc: "Ternary-like function" },
];

const MODULES = [
    { name: "array", doc: "Array manipulation functions (map, filter, reduce, etc.)" },
    { name: "string", doc: "String manipulation functions (to_upper, trim, split, etc.)" },
    { name: "math", doc: "Math functions (sqrt, pow, sin, cos, random, etc.)" },
    { name: "json", doc: "JSON parse and stringify" },
    { name: "fs", doc: "File system operations (read, write, exists, etc.)" },
    { name: "http", doc: "HTTP requests (get, post)" },
    { name: "datetime", doc: "Date and time operations" },
    { name: "regex", doc: "Regular expression operations" },
];

const ARRAY_METHODS = [
    "map", "filter", "reduce", "for_each", "find", "find_index",
    "includes", "index_of", "last_index_of", "slice", "first", "last",
    "is_empty", "sort", "reverse", "shuffle", "concat", "unique",
    "intersection", "union", "difference"
];

const STRING_METHODS = [
    "length", "to_upper", "to_lower", "to_title_case", "capitalize", "trim",
    "substring", "slice", "contains", "starts_with", "ends_with", "index_of",
    "replace", "split", "join"
];

const MATH_CONSTANTS = ["PI", "E"];
const MATH_METHODS = ["abs", "sqrt", "pow", "floor", "ceil", "round", "sin", "cos", "tan", "random", "seed", "randint"];

const LINT_RULES = ["no-unused-vars", "prefer-const", "no-magic-numbers"];

function detectRunner() {
    try {
        execSync("bun --version", { stdio: "ignore" });
        return "bun";
    } catch {
        return "node";
    }
}

function getLintConfig() {
    const config = vscode.workspace.getConfiguration("mimo.lint");
    return {
        enabled: config.get("enabled", true),
        onSave: config.get("onSave", true),
        onType: config.get("onType", true),
        delay: config.get("delay", 500),
        rules: {
            "no-unused-vars": config.get("rules.no-unused-vars", true),
            "prefer-const": config.get("rules.prefer-const", true),
            "no-magic-numbers": config.get("rules.no-magic-numbers", false)
        }
    };
}

function lintDocument(document) {
    if (document.languageId !== "mimo") return;
    
    const config = getLintConfig();
    if (!config.enabled) {
        diagnosticCollection.delete(document.uri);
        return;
    }

    const mimoCliPath = path.resolve(__dirname, "../../bin/cli.js");
    if (!fs.existsSync(mimoCliPath)) return;

    const filePath = document.fileName;
    const runner = detectRunner();

    const ruleArgs = Object.entries(config.rules)
        .filter(([_, enabled]) => enabled !== undefined)
        .map(([name, enabled]) => `--rule:${name}=${enabled}`);

    const args = [mimoCliPath, "lint", "--json", ...ruleArgs, filePath];

    let stdout = "";
    let stderr = "";

    const proc = spawn(runner, args, {
        cwd: path.dirname(filePath),
        env: { ...process.env, NODE_NO_WARNINGS: "1" }
    });

    proc.stdout.on("data", (data) => {
        stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
        stderr += data.toString();
    });

    proc.on("close", () => {
        try {
            const result = JSON.parse(stdout);
            const diagnostics = [];

            if (!result.ok && result.error) {
                const line = Math.max(0, (result.error.line || 1) - 1);
                const col = Math.max(0, (result.error.column || 1) - 1);
                const range = new vscode.Range(line, col, line, col + 1);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    result.error.message,
                    vscode.DiagnosticSeverity.Error
                ));
            } else if (result.messages) {
                for (const msg of result.messages) {
                    const line = Math.max(0, msg.line - 1);
                    const col = Math.max(0, msg.column - 1);
                    const endCol = msg.endColumn ? Math.max(col + 1, msg.endColumn - 1) : col + 1;
                    const range = new vscode.Range(line, col, line, endCol);
                    const severity = msg.severity === "error"
                        ? vscode.DiagnosticSeverity.Error
                        : vscode.DiagnosticSeverity.Warning;
                    diagnostics.push(new vscode.Diagnostic(range, msg.message, severity));
                }
            }

            diagnosticCollection.set(document.uri, diagnostics);
        } catch {
            // Ignore parse errors
        }
    });

    proc.on("error", () => {
        // Silently ignore
    });
}

function scheduleLint(document) {
    const config = getLintConfig();
    if (!config.enabled || !config.onType) return;

    const uriString = document.uri.toString();
    if (lintTimeouts.has(uriString)) {
        clearTimeout(lintTimeouts.get(uriString));
    }

    lintTimeouts.set(uriString, setTimeout(() => {
        lintTimeouts.delete(uriString);
        lintDocument(document);
    }, config.delay));
}

function activate(context) {
    outputChannel = vscode.window.createOutputChannel("Mimo Output");

    statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = "Mimo";
    statusBar.tooltip = "Mimo Language";
    context.subscriptions.push(statusBar);

    diagnosticCollection = vscode.languages.createDiagnosticCollection("mimo");
    context.subscriptions.push(diagnosticCollection);

    const runFile = vscode.commands.registerCommand("mimo.runFile", (uri) => {
        const document = uri ?
            vscode.workspace.textDocuments.find(d => d.uri.toString() === uri.toString()) :
            vscode.window.activeTextEditor?.document;

        const filePath = uri ? uri.fsPath : document?.fileName;

        if (!filePath) {
            vscode.window.showErrorMessage("No file selected to run.");
            return;
        }

        if (document && document.isDirty) {
            document.save();
        }

        outputChannel.clear();
        outputChannel.show(true);
        outputChannel.appendLine(`[Running] ${path.basename(filePath)}...`);

        const mimoCliPath = path.resolve(__dirname, "../../bin/cli.js");

        if (!fs.existsSync(mimoCliPath)) {
            outputChannel.appendLine(`ERROR: Mimo CLI not found at ${mimoCliPath}`);
            vscode.window.showErrorMessage("Mimo CLI not found. Make sure the extension is installed correctly.");
            return;
        }

        const runner = detectRunner();

        const proc = spawn(runner, [mimoCliPath, filePath], {
            cwd: path.dirname(filePath)
        });

        proc.stdout.on("data", (data) => {
            outputChannel.append(data.toString());
        });

        proc.stderr.on("data", (data) => {
            outputChannel.append(data.toString());
        });

        proc.on("error", (err) => {
            outputChannel.appendLine(`ERROR: Failed to run: ${err.message}`);
            vscode.window.showErrorMessage(`Failed to run Mimo file: ${err.message}`);
        });

        proc.on("close", (code) => {
            outputChannel.appendLine(`\n[Done] exited with code ${code}`);
        });
    });

    const completionProvider = vscode.languages.registerCompletionItemProvider(
        { language: "mimo", scheme: "file" },
        {
            provideCompletionItems(document, position) {
                const items = [];
                const linePrefix = document.lineAt(position).text.substring(0, position.character);

                if (linePrefix.endsWith("array.")) {
                    for (const method of ARRAY_METHODS) {
                        const item = new vscode.CompletionItem(method, vscode.CompletionItemKind.Method);
                        item.detail = "array method";
                        items.push(item);
                    }
                    return items;
                }

                if (linePrefix.endsWith("string.")) {
                    for (const method of STRING_METHODS) {
                        const item = new vscode.CompletionItem(method, vscode.CompletionItemKind.Method);
                        item.detail = "string method";
                        items.push(item);
                    }
                    return items;
                }

                if (linePrefix.endsWith("math.")) {
                    for (const method of MATH_METHODS) {
                        const item = new vscode.CompletionItem(method, vscode.CompletionItemKind.Method);
                        item.detail = "math function";
                        items.push(item);
                    }
                    for (const constant of MATH_CONSTANTS) {
                        const item = new vscode.CompletionItem(constant, vscode.CompletionItemKind.Constant);
                        item.detail = "math constant";
                        items.push(item);
                    }
                    return items;
                }

                for (const kw of KEYWORDS) {
                    const item = new vscode.CompletionItem(kw.name, vscode.CompletionItemKind.Keyword);
                    item.documentation = kw.doc;
                    items.push(item);
                }

                for (const builtin of BUILTINS) {
                    const item = new vscode.CompletionItem(builtin.name, vscode.CompletionItemKind.Function);
                    item.documentation = builtin.doc;
                    items.push(item);
                }

                for (const mod of MODULES) {
                    const item = new vscode.CompletionItem(mod.name, vscode.CompletionItemKind.Module);
                    item.documentation = mod.doc;
                    items.push(item);
                }

                return items;
            }
        },
        "."
    );

    const hoverProvider = vscode.languages.registerHoverProvider(
        { language: "mimo", scheme: "file" },
        {
            provideHover(document, position) {
                const range = document.getWordRangeAtPosition(position);
                if (!range) return;

                const word = document.getText(range);

                const kw = KEYWORDS.find(k => k.name === word);
                if (kw) {
                    return new vscode.Hover(`**${word}** (keyword)\n\n${kw.doc}`);
                }

                const builtin = BUILTINS.find(b => b.name === word);
                if (builtin) {
                    return new vscode.Hover(`**${word}** (builtin function)\n\n${builtin.doc}`);
                }

                const mod = MODULES.find(m => m.name === word);
                if (mod) {
                    return new vscode.Hover(`**${word}** (module)\n\n${mod.doc}`);
                }

                return;
            }
        }
    );

    // Lint on document change
    const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument((e) => {
        scheduleLint(e.document);
    });

    // Lint on document save
    const onDidSaveTextDocument = vscode.workspace.onDidSaveTextDocument((document) => {
        const config = getLintConfig();
        if (config.enabled && config.onSave) {
            lintDocument(document);
        }
    });

    // Lint on document open
    const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument((document) => {
        const config = getLintConfig();
        if (config.enabled && document.languageId === "mimo") {
            lintDocument(document);
        }
    });

    // Lint active editor on activate
    if (vscode.window.activeTextEditor) {
        const config = getLintConfig();
        if (config.enabled && vscode.window.activeTextEditor.document.languageId === "mimo") {
            lintDocument(vscode.window.activeTextEditor.document);
        }
    }

    context.subscriptions.push(runFile);
    context.subscriptions.push(completionProvider);
    context.subscriptions.push(hoverProvider);
    context.subscriptions.push(onDidChangeTextDocument);
    context.subscriptions.push(onDidSaveTextDocument);
    context.subscriptions.push(onDidOpenTextDocument);

    updateStatusBar();

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(updateStatusBar)
    );
}

function updateStatusBar() {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === "mimo") {
        statusBar.show();
    } else {
        statusBar.hide();
    }
}

function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
    if (statusBar) {
        statusBar.dispose();
    }
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
    for (const timeout of lintTimeouts.values()) {
        clearTimeout(timeout);
    }
    lintTimeouts.clear();
}

module.exports = {
    activate,
    deactivate,
};
