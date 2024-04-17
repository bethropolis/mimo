import Mimo from "..";
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

  let ast = await mimo.parse(tokens);

  let env = await mimo.interpret(ast);
};

let save = (filename, text) => {
  fs.writeFileSync(filename, text);
};

run("./test/mimo/fibonacci.mimo");
