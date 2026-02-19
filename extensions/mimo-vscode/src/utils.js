const vscode = require("vscode");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

/**
 * Detects if 'bun' or 'node' should be used to run the CLI.
 */
function detectRunner() {
    try {
        execSync("bun --version", { stdio: "ignore" });
        return "bun";
    } catch {
        return "node";
    }
}

/**
 * Finds the path to the Mimo CLI.
 * Priority:
 * 1. User configuration (mimo.executablePath)
 * 2. Mimo in system PATH
 * 3. Local development path (relative to extension)
 */
function getMimoPath() {
    const config = vscode.workspace.getConfiguration("mimo");
    const userPath = config.get("executablePath");

    if (userPath) {
        if (fs.existsSync(userPath)) {
            return userPath;
        }
        vscode.window.showWarningMessage(`Mimo: Configured executablePath not found: ${userPath}`);
    }

    // Try to find 'mimo' in system PATH
    try {
        const cmd = process.platform === 'win32' ? 'where mimo' : 'which mimo';
        const pathFromPath = execSync(cmd).toString().trim();
        if (pathFromPath) return pathFromPath;
    } catch {
        // Not in PATH
    }

    // Fallback to local development path
    const devPath = path.resolve(__dirname, "../../bin/cli.js");
    if (fs.existsSync(devPath)) {
        return devPath;
    }

    return null;
}

module.exports = {
    detectRunner,
    getMimoPath
};
