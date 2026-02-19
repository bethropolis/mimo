const vscode = require("vscode");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { detectRunner, getMimoPath } = require("./utils");
const { getLintConfig, lintDocument, scheduleLint, clearLintTimeouts } = require("./linter");
const { completionProvider, hoverProvider } = require("./providers");
const { formatter } = require("./formatter");
const { symbolProvider } = require("./symbols");
const { definitionProvider } = require("./definition");
const { renameProvider } = require("./rename");

let outputChannel;
let statusBar;
let diagnosticCollection;

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

        const mimoCliPath = getMimoPath();

        if (!mimoCliPath) {
            outputChannel.appendLine(`ERROR: Mimo CLI not found.`);
            vscode.window.showErrorMessage("Mimo CLI not found. Please set 'mimo.executablePath' in settings or ensure 'mimo' is in your PATH.");
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

    const registeredCompletionProvider = vscode.languages.registerCompletionItemProvider(
        { language: "mimo", scheme: "file" },
        completionProvider,
        "."
    );

    const registeredHoverProvider = vscode.languages.registerHoverProvider(
        { language: "mimo", scheme: "file" },
        hoverProvider
    );

    const registeredFormatter = vscode.languages.registerDocumentFormattingEditProvider(
        { language: "mimo", scheme: "file" },
        formatter
    );

    const registeredSymbolProvider = vscode.languages.registerDocumentSymbolProvider(
        { language: "mimo", scheme: "file" },
        symbolProvider
    );

    const registeredDefinitionProvider = vscode.languages.registerDefinitionProvider(
        { language: "mimo", scheme: "file" },
        definitionProvider
    );

    const registeredRenameProvider = vscode.languages.registerRenameProvider(
        { language: "mimo", scheme: "file" },
        renameProvider
    );

    // Lint on document change
    const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument((e) => {
        scheduleLint(e.document, diagnosticCollection);
    });

    // Lint on document save
    const onDidSaveTextDocument = vscode.workspace.onDidSaveTextDocument((document) => {
        const config = getLintConfig();
        if (config.enabled && config.onSave) {
            lintDocument(document, diagnosticCollection);
        }
    });

    // Lint on document open
    const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument((document) => {
        const config = getLintConfig();
        if (config.enabled && document.languageId === "mimo") {
            lintDocument(document, diagnosticCollection);
        }
    });

    // Lint active editor on activate
    if (vscode.window.activeTextEditor) {
        const config = getLintConfig();
        if (config.enabled && vscode.window.activeTextEditor.document.languageId === "mimo") {
            lintDocument(vscode.window.activeTextEditor.document, diagnosticCollection);
        }
    }

    context.subscriptions.push(runFile);
    context.subscriptions.push(registeredCompletionProvider);
    context.subscriptions.push(registeredHoverProvider);
    context.subscriptions.push(registeredFormatter);
    context.subscriptions.push(registeredSymbolProvider);
    context.subscriptions.push(registeredDefinitionProvider);
    context.subscriptions.push(registeredRenameProvider);
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
    clearLintTimeouts();
}

module.exports = {
    activate,
    deactivate,
};
