import { js_beautify } from "js-beautify";



let declaredVariables = new Set();

export function generateCodeFromAst(node) {
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

export function generateCodeJsFromAstArray(ast) {
  const generatedCode = ast.map(generateCodeFromAst).join("\n");
  return js_beautify(generatedCode);
}

function generateFunction(node) {
  const params = node.params.join(", ");
  const body = node.body.map(generateCodeFromAst).join("\n");
  return `function ${node.name}(${params}) {\n${body}\n}`;
}

function generateAssignment(node) {
  let prefix = "";
  if (!declaredVariables.has(node.target)) {
    prefix = "let ";
    declaredVariables.add(node.target);
  }
  return `${prefix}${node.target} = ${generateCodeFromAst(node.value)};`;
}

function generateWhile(node) {
  const condition = generateCodeFromAst(node.condition);
  const body = node.body.map(generateCodeFromAst).join("\n");
  return `while (${condition}) {\n${body}\n}`;
}

function generateIf(node) {
  const condition = generateCodeFromAst(node.condition);
  const consequent = node.consequent.map(generateCodeFromAst).join("\n");
  return `if (${condition}) {\n${consequent}\n}`;
}

function generateReturn(node) {
  return `return ${generateCodeFromAst(node.expression)};`;
}

function generateCall(node) {
  const args = node.args.map(generateCodeFromAst).join(", ");
  let callCode = `${node.name}(${args})`;
  if (node.target) {
    let prefix = "";
    if (!declaredVariables.has(node.target)) {
      prefix = "let ";
      declaredVariables.add(node.target);
    }
    callCode = `${prefix}${node.target} = ${callCode};`;
  }
  return callCode;
}

function generatePrint(node) {
  return `console.log(${generateCodeFromAst(node.value)});`;
}

function generateBinary(node) {
  const left = generateCodeFromAst(node.left);
  const right = generateCodeFromAst(node.right);
  return `${left} ${node.operator} ${right}`;
}

function generateIndexAccess(node) {
  const index = generateCodeFromAst(node.index);
  return `${node.name}[${index}]`;
}

function generateList(node) {
  const elements = node.elements.map(generateCodeFromAst).join(", ");
  return `[${elements}]`;
}
