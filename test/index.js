import Mimo from "../index.js";
import fs from "fs";

let mimo = new Mimo();

let readfile = (filename) => {
  try {
    return fs.readFileSync(filename, "utf-8");
  } catch (error) {
    console.error(`Error reading file '${filename}':`, error.message);
    process.exit(1);
  }
};

let run = async (filename) => {
  let code = readfile(filename);

  let tokens = await mimo.tokenize(code);
  fs.writeFileSync("./test/output/tokensindex.json", JSON.stringify(tokens, null, 2));

  let ast = await mimo.parse(tokens);

  fs.writeFileSync("./test/output/astIndex.json", JSON.stringify(ast, null, 2));
  let env = await mimo.interpret(ast);

  let js = mimo.toJS(ast);

  // console.log(js);
};

let save = (filename, text) => {
  fs.writeFileSync(filename, text);
};

run("./test/mimo/fibonacci.mimo");
run("./test/mimo/add.mimo");
run("./test/mimo/all.mimo");
