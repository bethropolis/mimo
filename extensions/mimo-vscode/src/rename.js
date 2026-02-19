const vscode = require("vscode");

const renameProvider = {
    provideRenameEdits(document, position, newName, token) {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) return;

        const oldName = document.getText(wordRange);
        const text = document.getText();
        const workspaceEdit = new vscode.WorkspaceEdit();

        // Simple regex-based find and replace for the current file
        // This is a basic implementation; a real LSP would do scope analysis.
        // We match whole words only.
        const regex = new RegExp(`\b${oldName}\b`, "g");
        
        let match;
        while ((match = regex.exec(text))) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + oldName.length);
            const range = new vscode.Range(startPos, endPos);
            workspaceEdit.replace(document.uri, range, newName);
        }

        return workspaceEdit;
    }
};

module.exports = {
    renameProvider
};
