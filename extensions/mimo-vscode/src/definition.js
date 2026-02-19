const vscode = require("vscode");

const definitionProvider = {
    provideDefinition(document, position, token) {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) return;

        const word = document.getText(wordRange);
        const text = document.getText();
        const locations = [];

        // Regex to find declarations of the word
        // Matches: function name, set name, let name, const name
        const declarationPattern = new RegExp(`^\s*(?:export\s+)?(?:function|set|let|const|global)\s+(${word})\b`, "gm");

        let match;
        while ((match = declarationPattern.exec(text))) {
            const startPos = document.positionAt(match.index + match[0].indexOf(match[1]));
            const endPos = document.positionAt(match.index + match[0].indexOf(match[1]) + match[1].length);
            const range = new vscode.Range(startPos, endPos);
            
            locations.push(new vscode.Location(document.uri, range));
        }

        return locations;
    }
};

module.exports = {
    definitionProvider
};
