let declaredVariables = new Set();

function generateGoCodeFromAst(node) {
  switch (node.type) {
    case "function":
      return generateFunction(node);
    case "assignment":
      return generateAssignment(node);
    case "while":
      return generateWhile(node);
    case "if":
      return generateIf(node);
    case "return":
      return generateReturn(node);
    case "call":
      return generateCall(node);
    case "print":
      return generatePrint(node);
    case "literal":
      return node.value;
    case "variable":
      return node.name;
    case "binary":
      return generateBinary(node);
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

export function generateGoCodeFromAstArray(ast) {
  declaredVariables = new Set();
  const functionCode = ast
    .filter((node) => node.type === "function")
    .map(generateGoCodeFromAst)
    .join("\n\n");
  const otherCode = ast
    .filter((node) => node.type !== "function")
    .map(generateGoCodeFromAst)
    .join("\n");
  return formatGoCode(`
    package main

    import "fmt"

    ${functionCode}

    func main() {
      ${otherCode}
    }
  `);
}

function generateFunction(node) {
  const params = node.params.map((p) => `${p} any`).join(", ");
  const body = node.body.map(generateGoCodeFromAst).join("\n");
  return `func ${node.name}(${params}) any {\n${body}\n}`;
}

function generateAssignment(node) {
  let prefix = "";
  if (!declaredVariables.has(node.target)) {
    prefix = "var ";
    declaredVariables.add(node.target);
  }
  return `${prefix}${node.target} = ${generateGoCodeFromAst(node.value)}`;
}

function generateWhile(node) {
  const condition = generateGoCodeFromAst(node.condition);
  const body = node.body.map(generateGoCodeFromAst).join("\n");
  return `for ${condition} {\n${body}\n}`;
}

function generateIf(node) {
  const condition = generateGoCodeFromAst(node.condition);
  const consequent = node.consequent.map(generateGoCodeFromAst).join("\n");
  return `if ${condition} {\n${consequent}\n}`;
}

function generateReturn(node) {
  return `return ${generateGoCodeFromAst(node.expression)}`;
}

function generateCall(node) {
  const args = node.args.map(generateGoCodeFromAst).join(", ");
  let callCode = `${node.name}(${args})`;
  if (node.target) {
    let prefix = "";
    if (!declaredVariables.has(node.target)) {
      prefix = "var ";
      declaredVariables.add(node.target);
    }
    callCode = `${prefix}${node.target} = ${callCode}`;
  }
  return callCode;
}

function generatePrint(node) {
  return `fmt.Println(${generateGoCodeFromAst(node.value)})`;
}

function generateBinary(node) {
  const left = generateGoCodeFromAst(node.left);
  const right = generateGoCodeFromAst(node.right);
  return `${left} ${node.operator} ${right}`;
}

function formatGoCode(code) {
  return code;
}
