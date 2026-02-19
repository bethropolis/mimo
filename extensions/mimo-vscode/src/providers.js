const vscode = require("vscode");
const {
    KEYWORDS,
    BUILTINS,
    MODULES,
    ARRAY_METHODS,
    STRING_METHODS,
    MATH_METHODS,
    MATH_CONSTANTS
} = require("./constants");

const completionProvider = {
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
};

const hoverProvider = {
    provideHover(document, position) {
        const range = document.getWordRangeAtPosition(position);
        if (!range) return;

        const word = document.getText(range);

        const kw = KEYWORDS.find(k => k.name === word);
        if (kw) {
            return new vscode.Hover(`**${word}** (keyword)

${kw.doc}`);
        }

        const builtin = BUILTINS.find(b => b.name === word);
        if (builtin) {
            return new vscode.Hover(`**${word}** (builtin function)

${builtin.doc}`);
        }

        const mod = MODULES.find(m => m.name === word);
        if (mod) {
            return new vscode.Hover(`**${word}** (module)

${mod.doc}`);
        }

        return;
    }
};

module.exports = {
    completionProvider,
    hoverProvider
};
