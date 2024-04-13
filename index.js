import { tokenize } from "./compiler/lexer/tokenizer";
import fs from "fs";
import { parse } from "./compiler/parser/parser";

const readCode = (filename) => fs.readFileSync(filename, "utf8");

async function main(file) {
  const start = performance.now();

  const code = await readCode(file);

  const tokens = await tokenize(code);
  fs.writeFileSync("tokensindex.json", JSON.stringify(tokens, null, 2));

  const ast = await parse(tokens);
  fs.writeFileSync("astIndex.json", JSON.stringify(ast, null, 2));

  // const env = await interpret(ast);

  const end = performance.now();
  const timeTaken = end - start;
  console.log("process took " + timeTaken + " milliseconds");
}

main("index.mimo");
