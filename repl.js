#!/usr/bin/env node
import readline from "node:readline";
import { fileURLToPath } from 'url';
import { nodeAdapter as adapter } from "./adapters/nodeAdapter.js";
import { Interpreter } from "./interpreter/index.js";
import { Lexer } from "./lexer/Lexer.js";
import { Parser } from "./parser/Parser.js";
import { stringify } from "./interpreter/Utils.js";

/**
 * Starts and manages the Mimo interactive REPL session.
 */
export function runRepl() {
    console.log("Welcome to Mimo REPL! Type 'exit' or Ctrl+D to leave.");

    const promptString = "\x1b[36mmimo>\x1b[0m ";
    const replFilePath = "/repl";

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: promptString,
        historySize: 1000,
    });

    const interpreter = new Interpreter(adapter);

    // This is now a local helper function for the REPL
    function processInput(input) {
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
                    adapter.log(stringify(result));
                }
            }
        } catch (err) {
            interpreter.errorHandler.printError(err);
        }
    }

    let multiLineBuffer = "";
    let inMultiLineMode = false;

    rl.on("line", (line) => {
        const trimmedLine = line.trim();
        if (trimmedLine.toLowerCase() === "exit") {
            rl.close();
            return;
        }

        if (inMultiLineMode) {
            multiLineBuffer += "\n" + line;
            if (trimmedLine === "end") {
                const fullInput = multiLineBuffer;
                multiLineBuffer = "";
                inMultiLineMode = false;
                rl.setPrompt(promptString);
                processInput(fullInput);
                rl.prompt();
            } else {
                rl.setPrompt(".... ");
                rl.prompt();
            }
            return;
        }
        
        if (["function ", "if ", "while ", "for ", "try ", "match "].some(k => trimmedLine.startsWith(k))) {
            multiLineBuffer = line;
            inMultiLineMode = true;
            rl.setPrompt(".... ");
            rl.prompt();
            return;
        }

        processInput(line);
        rl.prompt();
    });

    rl.on('close', () => {
        adapter.exit(0);
    });

    rl.prompt();
}



// This check ensures the REPL starts automatically only when `node repl.js` is run
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runRepl();
}