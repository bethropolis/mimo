const vscode = require("vscode");

const symbolProvider = {
    provideDocumentSymbols(document, token) {
        const symbols = [];
        const text = document.getText();
        
        // Regex patterns for Mimo constructs
        const functionPattern = /^\s*(?:export\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_]*)/gm;
        const variablePattern = /^\s*(?:export\s+)?(?:set|let|const|global)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gm;
        const classPattern = /^\s*(?:export\s+)?class\s+([a-zA-Z_][a-zA-Z0-9_]*)/gm; // Future proofing

        // Find Functions
        let match;
        while ((match = functionPattern.exec(text))) {
            const name = match[1];
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);
            
            // Try to estimate the full range including body (heuristic: indent based or find matching end)
            // For simple symbols, the selection range is the name, full range is the line.
            const fullRange = document.lineAt(startPos.line).range;

            symbols.push(new vscode.DocumentSymbol(
                name,
                "Function",
                vscode.SymbolKind.Function,
                fullRange,
                range
            ));
        }

        // Find Variables
        while ((match = variablePattern.exec(text))) {
            const name = match[1];
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);
            const fullRange = document.lineAt(startPos.line).range;

            symbols.push(new vscode.DocumentSymbol(
                name,
                "Variable",
                vscode.SymbolKind.Variable,
                fullRange,
                range
            ));
        }

        return symbols;
    }
};

module.exports = {
    symbolProvider
};
