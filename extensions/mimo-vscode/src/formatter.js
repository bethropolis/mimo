const vscode = require("vscode");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { detectRunner, getMimoPath } = require("./utils");

const formatter = {
    /**
     * @param {vscode.TextDocument} document
     * @param {vscode.FormattingOptions} options
     * @param {vscode.CancellationToken} token
     */
    async provideDocumentFormattingEdits(document, options, token) {
        const config = vscode.workspace.getConfiguration("mimo");
        if (!config.get("format.enabled", true)) {
            return [];
        }

        const mimoCliPath = getMimoPath();
        if (!mimoCliPath) {
            return [];
        }

        const runner = detectRunner();
        const text = document.getText();

        return new Promise((resolve) => {
            const proc = spawn(runner, [mimoCliPath, "fmt", "-"], {
                cwd: path.dirname(document.fileName),
                env: { ...process.env, NODE_NO_WARNINGS: "1" }
            });

            let stdout = "";
            let stderr = "";

            proc.stdout.on("data", (data) => {
                stdout += data.toString();
            });

            proc.stderr.on("data", (data) => {
                stderr += data.toString();
            });

            proc.on("close", (code) => {
                if (code === 0 && stdout) {
                    const fullRange = new vscode.Range(
                        document.positionAt(0),
                        document.positionAt(text.length)
                    );
                    resolve([vscode.TextEdit.replace(fullRange, stdout)]);
                } else {
                    console.error(`Mimo Formatter failed: ${stderr}`);
                    resolve([]);
                }
            });

            proc.on("error", (err) => {
                console.error(`Failed to spawn Mimo Formatter: ${err.message}`);
                resolve([]);
            });

            // Write the current text to the process's stdin
            proc.stdin.write(text);
            proc.stdin.end();

            // Handle cancellation
            token.onCancellationRequested(() => {
                proc.kill();
                resolve([]);
            });
        });
    }
};

module.exports = {
    formatter
};
