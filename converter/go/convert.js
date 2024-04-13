let declaredVariables = new Set();

export function generateGoCodeFromAst(node) {
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
    case "indexAccess":
      return generateIndexAccess(node);
    case "list":
      return generateList(node);
    default:
      console.log(node);
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

export function generateGoCodeFromAstArray(ast) {
  declaredVariables = new Set();
  const generatedCode = ast.map(generateGoCodeFromAst).join("\n");
  return formatGoCode(generatedCode);
}

function generateFunction(node) {
  const params = node.params.join(", ");
  const body = node.body.map(generateGoCodeFromAst).join("\n");
  return `func ${node.name}(${params}) {\n${body}\n}`;
}

function generateAssignment(node) {
  let prefix = "";
  if (!declaredVariables.has(node.target)) {
    prefix = "var ";
    declaredVariables.add(node.target);
  }
  return `${prefix}${node.target} := ${generateGoCodeFromAst(node.value)}`;
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
  return `${node.name}(${args})`;
}

function generatePrint(node) {
  return `fmt.Println(${generateGoCodeFromAst(node.value)})`;
}

function generateBinary(node) {
  const left = generateGoCodeFromAst(node.left);
  const right = generateGoCodeFromAst(node.right);
  return `${left} ${node.operator} ${right}`;
}

function generateIndexAccess(node) {
  const index = generateGoCodeFromAst(node.index);
  return `${node.name}[${index}]`;
}

function generateList(node) {
  const elements = node.elements.map(generateGoCodeFromAst).join(", ");
  return `[]interface{}{${elements}}`;
}

function formatGoCode(code) {
  return code;
}
