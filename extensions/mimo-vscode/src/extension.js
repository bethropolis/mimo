const vscode = require("vscode");
const { spawn } = require("child_process");
const path = require("path");

let outputChannel;

function activate(context) {
  outputChannel = vscode.window.createOutputChannel("Mimo Output");

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

    // Determine the root of mimo-next to find the CLI
    const mimoCliPath = path.resolve(__dirname, "../../bin/cli.js");

    // Use bun if available
    const runner = "bun";

    const process = spawn(runner, [mimoCliPath, filePath]);

    process.stdout.on("data", (data) => {
      outputChannel.append(data.toString());
    });

    process.stderr.on("data", (data) => {
      outputChannel.append(`ERROR: ${data.toString()}`);
    });

    process.on("close", (code) => {
      outputChannel.appendLine(`\n[Done] exited with code ${code}`);
    });
  });

  context.subscriptions.push(runFile);
}

function deactivate() {
  if (outputChannel) {
    outputChannel.dispose();
  }
}

module.exports = {
  activate,
  deactivate,
};
