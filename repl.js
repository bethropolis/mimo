#!/usr/bin/env bun
import readline from "node:readline";
import { fileURLToPath } from 'url';
import { nodeAdapter as adapter } from "./adapters/nodeAdapter.js";
import { Interpreter } from "./interpreter/index.js";
import { Lexer } from "./lexer/Lexer.js";
import { Parser } from "./parser/Parser.js";
import { stringify, highlightMimoCode } from "./interpreter/Utils.js";
import fs from "node:fs";
import path from "node:path";

const HISTORY_FILE = path.join(process.cwd(), ".mimo_history");

/**
 * Tracking nesting levels for dynamic multiline input.
 */
class NestingTracker {
    constructor() {
        this.reset();
    }

    reset() {
        this.nestedBlocks = 0; // for if, while, for, function, fn, try, match
        this.openParens = 0;
        this.openBrackets = 0;
        this.openBraces = 0;
    }

    track(input) {
        // Simple scanning for nesting indicators
        // We use words for blocks, but avoid them in strings/comments
        const tokens = input.split(/\s+/);

        // Count keywords that increase depth
        const blockStart = ["if", "while", "for", "function", "fn", "try", "match"];
        const blockEnd = ["end"];

        for (const token of tokens) {
            if (blockStart.includes(token)) this.nestedBlocks++;
            if (blockEnd.includes(token)) this.nestedBlocks--;
        }

        // Count individual chars for delimiters
        for (const char of input) {
            if (char === '(') this.openParens++;
            if (char === ')') this.openParens--;
            if (char === '[') this.openBrackets++;
            if (char === ']') this.openBrackets--;
            if (char === '{') this.openBraces++;
            if (char === '}') this.openBraces--;
        }
    }

    isBalanced() {
        return this.nestedBlocks <= 0 &&
            this.openParens <= 0 &&
            this.openBrackets <= 0 &&
            this.openBraces <= 0;
    }
}

export function runRepl() {
    console.log("\x1b[1;35mWelcome to Mimo REPL!\x1b[0m");
    console.log("Type \x1b[36m.help\x1b[0m for commands or \x1b[36mexit\x1b[0m to leave.");

    const promptString = "\x1b[36m(mimo)\x1b[0m ";
    const multilinePrompt = "\x1b[90m  ... \x1b[0m ";
    const replFilePath = "/repl";

    // Load history if exists
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
        history = fs.readFileSync(HISTORY_FILE, "utf-8").split("\n").filter(Boolean);
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: promptString,
        historySize: 1000,
        history: history.reverse(),
    });

    const interpreter = new Interpreter(adapter);
    const nesting = new NestingTracker();

    function processInput(input) {
        // Save to history file
        fs.appendFileSync(HISTORY_FILE, input.trim() + "\n");

        interpreter.currentFile = replFilePath;
        interpreter.errorHandler.addSourceFile(replFilePath, input);

        try {
            const lexer = new Lexer(input, replFilePath);
            const tokens = [];
            let token;
            while ((token = lexer.nextToken()) !== null) {
                tokens.push(token);
            }

            if (tokens.length === 0) return;

            const parser = new Parser(tokens, replFilePath);
            parser.setErrorHandler(interpreter.errorHandler);
            const ast = parser.parse();

            const result = interpreter.interpret(ast, replFilePath);

            const lastStatement = ast.body[ast.body.length - 1];
            if (lastStatement && lastStatement.type !== "ShowStatement" && lastStatement.type !== "FunctionDeclaration") {
                if (result !== undefined && result !== null) {
                    console.log(`\x1b[90m=>\x1b[0m ${stringify(result, true)}`);
                }
            }
        } catch (err) {
            interpreter.errorHandler.printError(err);
        }
    }

    function handleCommand(cmd) {
        const parts = cmd.trim().split(/\s+/);
        const action = parts[0].toLowerCase();

        switch (action) {
            case ".help":
                console.log("\x1b[1mREPL Commands:\x1b[0m");
                console.log("  \x1b[36m.help\x1b[0m     Show this help");
                console.log("  \x1b[36m.clear\x1b[0m    Clear the screen");
                console.log("  \x1b[36m.history\x1b[0m  Show recently used commands");
                console.log("  \x1b[36m.exit\x1b[0m     Exit the REPL");
                break;
            case ".clear":
                process.stdout.write("\u001b[2J\u001b[0;0H");
                break;
            case ".history":
                console.log(rl.history.slice(0, 20).reverse().join("\n"));
                break;
            case ".exit":
                rl.close();
                break;
            default:
                console.log(`Unknown command: ${action}`);
        }
    }

    let buffer = "";

    rl.on("line", (line) => {
        const trimmed = line.trim();

        if (trimmed === "exit") {
            rl.close();
            return;
        }

        if (trimmed.startsWith(".")) {
            handleCommand(trimmed);
            rl.prompt();
            return;
        }

        buffer += (buffer ? "\n" : "") + line;
        nesting.track(line);

        if (nesting.isBalanced()) {
            if (buffer.trim()) {
                processInput(buffer);
            }
            buffer = "";
            nesting.reset();
            rl.setPrompt(promptString);
        } else {
            rl.setPrompt(multilinePrompt);
        }

        rl.prompt();
    });

    rl.on('close', () => {
        console.log("\nBye!");
        process.exit(0);
    });

    rl.prompt();
}




// This check ensures the REPL starts automatically only when `node repl.js` is run
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runRepl();
}