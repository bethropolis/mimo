#!/usr/bin/env bun
import readline from "node:readline";
import { fileURLToPath } from 'url';
import { nodeAdapter as adapter } from "./adapters/nodeAdapter.js";
import { Interpreter } from "./interpreter/index.js";
import { Lexer } from "./lexer/Lexer.js";
import { Parser } from "./parser/Parser.js";
import { stringify, highlightMimoCode } from "./interpreter/Utils.js";
import { formatValue } from "./tools/replFormatter.js";
import fs from "node:fs";
import path from "node:path";
import { getMimoType } from "./interpreter/suggestions.js";

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
    const isInteractive = process.stdin.isTTY;

    if (isInteractive) {
        console.log("\x1b[1;35mWelcome to Mimo REPL!\x1b[0m");
        console.log("Type \x1b[36m:help\x1b[0m for commands or \x1b[36mexit\x1b[0m to leave.");
    }

    const promptString = isInteractive ? "\x1b[36m(mimo)\x1b[0m " : "";
    const multilinePrompt = isInteractive ? "\x1b[90m  ... \x1b[0m " : "";
    const replFilePath = "/repl";

    // Load history if exists and interactive
    let history = [];
    if (isInteractive && fs.existsSync(HISTORY_FILE)) {
        history = fs.readFileSync(HISTORY_FILE, "utf-8").split("\n").filter(Boolean);
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: promptString,
        historySize: 1000,
        history: isInteractive ? history.reverse() : [],
    });

    let interpreter = new Interpreter(adapter);
    const nesting = new NestingTracker();
    const sessionHistory = [];

    function processInput(input) {
        // Save to history file if interactive
        if (isInteractive) {
            fs.appendFileSync(HISTORY_FILE, input.trim() + "\n");
        }
        sessionHistory.push(input);

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
            setLastResult(result);

            const lastStatement = ast.body[ast.body.length - 1];
            if (lastStatement && lastStatement.type !== "ShowStatement" && lastStatement.type !== "FunctionDeclaration") {
                if (result !== undefined && result !== null) {
                    const prefix = isInteractive ? "\x1b[90m=>\x1b[0m " : "=> ";
                    console.log(`${prefix}${formatValue(result, isInteractive)}`);
                }
            }
        } catch (err) {
            interpreter.errorHandler.printError(err);
        }
    }

    function parseToAst(source, filePath = replFilePath) {
        const lexer = new Lexer(source, filePath);
        const tokens = [];
        let token;
        while ((token = lexer.nextToken()) !== null) {
            tokens.push(token);
        }

        const parser = new Parser(tokens, filePath);
        parser.setErrorHandler(interpreter.errorHandler);
        return parser.parse();
    }

    function setLastResult(value) {
        if (value === undefined) return;
        const existing = interpreter.globalEnv.getVariableInfo("_");
        if (existing) {
            existing.env.assign("_", value);
        } else {
            interpreter.globalEnv.define("_", value, "set");
        }
    }

    function resetEnvironment() {
        interpreter = new Interpreter(adapter);
    }

    function handleCommand(cmd) {
        if (!isInteractive) return;
        const trimmed = cmd.trim();
        const parts = trimmed.split(/\s+/);
        const action = parts[0].toLowerCase();
        const payload = trimmed.slice(action.length).trim();

        switch (action) {
            case ".help":
            case ":help":
                console.log("\x1b[1mREPL Commands:\x1b[0m");
                console.log("  \x1b[36m:help\x1b[0m     Show this help");
                console.log("  \x1b[36m:clear\x1b[0m    Reset REPL environment");
                console.log("  \x1b[36m:history\x1b[0m  Show recently used commands");
                console.log("  \x1b[36m:type x\x1b[0m   Show Mimo type of variable x");
                console.log("  \x1b[36m:load f\x1b[0m   Execute a .mimo file into current REPL env");
                console.log("  \x1b[36m:save f\x1b[0m   Save REPL history to file");
                console.log("  \x1b[36m:time expr\x1b[0m Measure expression/program execution time");
                console.log("  \x1b[36m:ast expr\x1b[0m  Parse input and print AST JSON");
                console.log("  \x1b[36m:exit\x1b[0m     Exit the REPL");
                break;
            case ".clear":
            case ":clear":
                resetEnvironment();
                process.stdout.write("\u001b[2J\u001b[0;0H");
                break;
            case ".history":
            case ":history":
                rl.history
                    .slice(0, 20)
                    .reverse()
                    .forEach((entry, idx) => console.log(`${idx + 1}. ${entry}`));
                break;
            case ":type": {
                const targetName = parts[1];
                if (!targetName) {
                    console.log("Usage: :type <variable>");
                    break;
                }
                try {
                    const value = interpreter.currentEnv.lookup(targetName);
                    console.log(getMimoType(value));
                } catch {
                    console.log(`Undefined variable: ${targetName}`);
                }
                break;
            }
            case ":load": {
                if (!payload) {
                    console.log("Usage: :load <file>");
                    break;
                }
                const target = path.resolve(process.cwd(), payload);
                if (!fs.existsSync(target)) {
                    console.log(`File not found: ${target}`);
                    break;
                }
                try {
                    const source = fs.readFileSync(target, "utf-8");
                    processInput(source);
                } catch (err) {
                    console.log(`Failed to load '${target}': ${err.message}`);
                }
                break;
            }
            case ":save": {
                if (!payload) {
                    console.log("Usage: :save <file>");
                    break;
                }
                const target = path.resolve(process.cwd(), payload);
                try {
                    const sessionLines = sessionHistory
                        .slice()
                        .filter((entry) => entry && !entry.trim().startsWith(":") && !entry.trim().startsWith("."));
                    fs.writeFileSync(target, `${sessionLines.join("\n")}\n`, "utf-8");
                    console.log(`Saved ${sessionLines.length} entries to ${target}`);
                } catch (err) {
                    console.log(`Failed to save '${target}': ${err.message}`);
                }
                break;
            }
            case ":time": {
                if (!payload) {
                    console.log("Usage: :time <expr|statement>");
                    break;
                }
                const start = process.hrtime.bigint();
                processInput(payload);
                const end = process.hrtime.bigint();
                const elapsedMs = Number(end - start) / 1_000_000;
                console.log(`\x1b[90mExecuted in ${elapsedMs.toFixed(3)} ms\x1b[0m`);
                break;
            }
            case ":ast": {
                if (!payload) {
                    console.log("Usage: :ast <expr|statement>");
                    break;
                }
                try {
                    const ast = parseToAst(payload, "/repl_ast");
                    console.log(JSON.stringify(ast, null, 2));
                } catch (err) {
                    interpreter.errorHandler.printError(err);
                }
                break;
            }
            case ".exit":
            case ":exit":
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

        if ((trimmed.startsWith(".") || trimmed.startsWith(":")) && isInteractive) {
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
        if (isInteractive) {
            console.log("\nBye!");
        }
        process.exit(0);
    });

    rl.prompt();
}




// This check ensures the REPL starts automatically only when `node repl.js` is run
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runRepl();
}
