const vscode = require("vscode");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { detectRunner, getMimoPath } = require("./utils");

let lintTimeouts = new Map();

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

function lintDocument(document, diagnosticCollection) {
    if (document.languageId !== "mimo") return;
    
    const config = getLintConfig();
    if (!config.enabled) {
        diagnosticCollection.delete(document.uri);
        return;
    }

    const mimoCliPath = getMimoPath();
    if (!mimoCliPath) return;

    const filePath = document.fileName;
    const runner = detectRunner();

    const ruleArgs = Object.entries(config.rules)
        .filter(([_, enabled]) => enabled !== undefined)
        .map(([name, enabled]) => `--rule:${name}=${enabled}`);

    const args = [mimoCliPath, "lint", "--json", ...ruleArgs, filePath];

    let stdout = "";

    const proc = spawn(runner, args, {
        cwd: path.dirname(filePath),
        env: { ...process.env, NODE_NO_WARNINGS: "1" }
    });

    proc.stdout.on("data", (data) => {
        stdout += data.toString();
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
}

function scheduleLint(document, diagnosticCollection) {
    const config = getLintConfig();
    if (!config.enabled || !config.onType) return;

    const uriString = document.uri.toString();
    if (lintTimeouts.has(uriString)) {
        clearTimeout(lintTimeouts.get(uriString));
    }

    lintTimeouts.set(uriString, setTimeout(() => {
        lintTimeouts.delete(uriString);
        lintDocument(document, diagnosticCollection);
    }, config.delay));
}

function clearLintTimeouts() {
    for (const timeout of lintTimeouts.values()) {
        clearTimeout(timeout);
    }
    lintTimeouts.clear();
}

module.exports = {
    getLintConfig,
    lintDocument,
    scheduleLint,
    clearLintTimeouts
};
