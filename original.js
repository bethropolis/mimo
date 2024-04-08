import fs from "fs";

function tokenize(input) {
  const tokens = [];
  let currentToken = "";
  let currentType = null;
  let inComment = false;
  let inString = false;

  const isOperator = (char) =>
    ["+", "-", "*", "/", ">", "<", "=", "!"].includes(char);

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inComment) {
      if (char === "\n") {
        inComment = false;
      }
      continue;
    }

    if (char === "/" && input[i + 1] === "/") {
      inComment = true;
      i++; // Skip the second '/'
      continue;
    }

    if (char === '"') {
      inString = !inString;
      if (!inString) {
        tokens.push({ type: "string", value: currentToken });
        currentToken = "";
      }
      continue;
    }

    if (inString) {
      currentToken += char;
      continue;
    }

    if (/\s/.test(char)) {
      if (currentToken) {
        tokens.push({ type: currentType, value: currentToken });
        currentToken = "";
        currentType = null;
      }
      continue;
    }

    if (isOperator(char)) {
      if (currentToken) {
        tokens.push({ type: currentType, value: currentToken });
        currentToken = "";
        currentType = null;
      }
      currentType = "operator";
      currentToken += char;

      // Check if the next character is also an operator
      if (i < input.length - 1 && isOperator(input[i + 1])) {
        currentToken += input[i + 1];
        i++; // Skip the next operator character
      }
    } else if (["(", ")", ",", "[", "]"].includes(char)) {
      if (currentToken) {
        tokens.push({ type: currentType, value: currentToken });
        currentToken = "";
        currentType = null;
      }
      tokens.push({ type: "punctuation", value: char });
    } else {
      currentToken += char;
      if (!currentType) {
        currentType = /[a-zA-Z]/.test(char)
          ? "identifier"
          : /[0-9]/.test(char)
          ? "number"
          : null;
      }
    }
  }

  if (currentToken) {
    tokens.push({ type: currentType, value: currentToken });
  }

  return tokens;
}

// Parser function
function parse(tokens) {
  let index = 0;

  const parseExpression = () => {
    if (tokens[index].type === "number") {
      return { type: "literal", value: parseFloat(tokens[index++].value) };
    } else if (tokens[index].type === "string") {
      return { type: "literal", value: tokens[index++].value };
    } else if (
      tokens[index].type === "identifier" &&
      tokens[index + 1] &&
      tokens[index + 1].value === "["
    ) {
      const name = tokens[index].value;
      index += 2; // Skip identifier and '['
      const indexExpression = parseExpression(); // Parse the index inside the brackets
      if (tokens[index] && tokens[index].value === "]") {
        index++; // Skip ']'
      }

      return { type: "indexAccess", name, index: indexExpression };
    } else if (tokens[index].type === "identifier") {
      return { type: "variable", name: tokens[index++].value };
    } else if (tokens[index].type === "operator") {
      let operator = tokens[index++].value;
      const left = parseExpression();
      if (index < tokens.length && tokens[index].type === "operator") {
        operator += tokens[index++].value; // Handle two-character operators like '=='
      }
      const right = parseExpression();
      return { type: "binary", operator, left, right };
    } else if (
      tokens[index].type === "punctuation" &&
      tokens[index].value === "["
    ) {
      index++; // Skip '['
      const elements = [];
      while (
        tokens[index] &&
        tokens[index].type !== "punctuation" &&
        tokens[index].value !== "]"
      ) {
        elements.push(parseExpression());
        if (
          tokens[index] &&
          tokens[index].type === "punctuation" &&
          tokens[index].value === ","
        ) {
          index++; // Skip ',' between elements
        }
      }
      if (
        tokens[index] &&
        tokens[index].type === "punctuation" &&
        tokens[index].value === "]"
      ) {
        index++; // Skip ']'
      }
      return { type: "list", elements };
    } else if (
      [">", "<", ">=", "<=", "==", "!="].includes(tokens[index].value)
    ) {
      const operator = tokens[index++].value;
      const left = parseExpression();
      const right = parseExpression();
      return { type: "comparison", operator, left, right };
    }
  };

  const parseStatement = () => {
    const statement = { type: "statement" };

    if (tokens[index].value === "set") {
      index++;
      statement.type = "assignment";
      statement.target = tokens[index++].value;
      statement.value = parseExpression();
    } else if (tokens[index].value === "if") {
      index++;
      statement.type = "if";
      statement.condition = parseExpression();
      statement.consequent = parseStatement();
      if (tokens[index].value === "else") {
        index++;
        statement.alternate = parseStatement();
      }
      if (tokens[index].value === "endif") {
        index++;
      }
    } else if (tokens[index].value === "while") {
      index++;
      statement.type = "while";
      statement.condition = parseExpression();
      const body = [];
      while (tokens[index] && tokens[index].value !== "endwhile") {
        body.push(parseStatement());
      }
      if (tokens[index].value === "endwhile") {
        index++;
      }
      statement.body = body;
    } else if (tokens[index].value === "function") {
      index++;
      statement.type = "function";
      statement.name = tokens[index++].value;
      statement.params = [];
      while (tokens[index].value !== "endfunction") {
        statement.params.push(tokens[index++].value);
      }
      index++; // Skip 'endfunction'
      statement.body = parseStatement(); // Parse the function body directly
    } else if (tokens[index].value === "call") {
      index++;
      statement.type = "call";
      statement.name = tokens[index++].value;
      statement.args = [];
      while (tokens[index].value !== "->") {
        statement.args.push(parseExpression());
        if (tokens[index].value !== "->") {
          index++;
        }
      }
      index++;
      statement.target = tokens[index++].value;
    } else if (tokens[index].value === "show") {
      index++;
      statement.type = "print";
      statement.value = parseExpression();
    }

    return statement;
  };

  const program = [];
  while (index < tokens.length) {
    program.push(parseStatement());
  }

  return program;
}

// Interpreter function
function interpret(program, env = {}) {
  let index = 0; // Index to keep track of the current statement

  const interpretStatement = (statement) => {
    switch (statement.type) {
      case "assignment":
        env[statement.target] = evaluate(statement.value, env);
        break;
      case "if":
        if (evaluate(statement.condition, env)) {
          interpretStatement(statement.consequent); // Pass the consequent directly
        } else if (statement.alternate) {
          interpretStatement(statement.alternate); // Pass the alternate directly
        }
        break;
      case "while":
        while (evaluate(statement.condition, env)) {
          interpretStatement(statement.body); // Pass the body directly
        }
        break;
      case "function":
        env[statement.name] = createFunction(
          statement.params,
          statement.body,
          env
        );
        break;
      case "call":
        const func = env[statement.name];
        env[statement.target] = func(
          statement.args.map((arg) => evaluate(arg, env))
        );
        break;
      case "print":
        console.log(evaluate(statement.value, env));
        break;
    }
  };

  while (index < program.length) {
    interpretStatement(program[index++]); // Increment index after each statement
  }

  return env;
}

const evaluate = (expression, env) =>
  expression.type === "literal"
    ? expression.value
    : expression.type === "variable"
    ? env[expression.name]
    : expression.type === "list"
    ? expression.elements.map((element) => evaluate(element, env))
    : expression.type === "indexAccess"
    ? env[expression.name][evaluate(expression.index, env)]
    : null
    
const operate = (operator, left, right) => {
  switch (operator) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      return left / right;
  }
};

function createFunction(params, body, env) {
  return function (...args) {
    const newEnv = { ...env };
    params.forEach((param, index) => {
      newEnv[param] = args[index];
    });
    interpret(body, newEnv); // Interpret the body of the function
  };
}

const readCode = (filename) => fs.readFileSync(filename, "utf8");

let file = "index.mimo";

const code = readCode(file);
// console.log("Code:", code);

const tokens = tokenize(code);
// console.log("Tokens:", tokens);

const ast = parse(tokens);

fs.writeFileSync("ast.json", JSON.stringify(ast, null, 2));
console.log("AST:", ast);

const env = interpret(ast);
// console.log("Environment:", env);
