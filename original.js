import fs, { writeFileSync } from "fs";
import { type } from "os";

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
      if (tokens[index].value === "(") {
        index++; // Skip '('
        while (tokens[index].value !== ")") {
          if (tokens[index].type === "identifier") {
            statement.params.push(tokens[index++].value);
          }
          if (tokens[index].value === ",") {
            index++; // Skip ','
          }
        }
        index++; // Skip ')'
      }
      const body = [];
      while (tokens[index] && tokens[index].value !== "endfunction") {
        body.push(parseStatement());
      }
      if (tokens[index].value === "endfunction") {
        index++;
      }
      statement.body = body;
    } else if (tokens[index].value === "call") {
      index++;
      statement.type = "call";
      statement.name = tokens[index++].value;
      statement.args = [];
      statement.target = null;
      if (tokens[index].value === "(") {
        index++; // Skip '('
        while (tokens[index].value !== ")") {
          if (tokens[index].value !== ",") {
            statement.args.push(parseExpression());
          }else{
            index++; // Skip ','
          }
        }
        index++; // Skip ')'
      }
      if ((tokens[index++].value = "->")) {
        statement.target = tokens[index++].value;
      }
    } else if (tokens[index].value === "return") {
      index++;
      statement.type = "return";
      statement.value = parseExpression();
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
async function interpret(program, env = {}) {
  let index = 0; // Index to keep track of the current statement

  const interpretStatement = async (statement) => {
    // if statement type of array
    if (Array.isArray(statement)) {
      for (let i = 0; i < statement.length; i++) {
        if(await interpretStatement(statement[i])) return true;
      }
      return;
    }

    if (typeof statement === "object") {
      switch (statement.type) {
        case "assignment":
          env[statement.target] = evaluate(statement.value, env);
          break;

        case "binary":
          console.log("Binary", statement);
          if (env[statement.target] === undefined) {
            env[statement.target] = null;
          }

          env[statement.target] = await operate(
            statement.operator,
            await evaluate(statement.left, env),
            await evaluate(statement.right, env)
          );
          break;
        case "if":
          if (evaluate(statement.condition, env)) {
            if(await interpretStatement(statement.consequent)) return true; // Pass the consequent directly
          } else if (statement.alternate) {
            if(await interpretStatement(statement.alternate)) return true; // Pass the alternate directly
          }
          break;
        case "while":
          while (evaluate(statement.condition, env)) {
            if(await interpretStatement(statement.body))return true; // Pass the body directly
          }
          break;
        case "function":
          env[statement.name] = createFunction(
            statement.params,
            statement.body,
            env
          );
          break;
        case "return":
          env["return"] = evaluate(statement.value, env);
          return true;
        case "call":
          const func = env[statement.name];
          const args = statement.args.map((arg) => evaluate(arg, env));
          env[statement.target] = await func(...args);
          break;
        case "print":
          console.log(evaluate(statement.value, env));
          break;
        default:
          console.log("Unknown statement type", statement.type);
          break;
      }
    }
  };

  while (index < program.length) {
    if(await interpretStatement(program[index++])) break;
  }

  return env;
}

const evaluate = (expression, env) =>
  expression.type === "literal"
    ? expression.value
    : expression.type === "variable"
    ? env.hasOwnProperty(expression.name)
      ? env[expression.name]
      : null
    : expression.type === "list"
    ? expression.elements.map((element) => evaluate(element, env))
    : expression.type === "indexAccess"
    ? env[expression.name][evaluate(expression.index, env)]
    : expression.type === "binary"
    ? operate(
        expression.operator,
        evaluate(expression.left, env),
        evaluate(expression.right, env)
      )
    : null;

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
    case ">":
      return left > right;
    case "<":
      return left < right;
  }
};

function createFunction(params, body, env) {
  return async function (...args) {
    const newEnv = { ...env };
    params.forEach((param, index) => {
      newEnv[param] = args[index] ?? undefined;
    });
    return (await interpret(body, newEnv))["return"]; 
  };
}

const readCode = (filename) => fs.readFileSync(filename, "utf8");

async function main(file) {
  const start = performance.now();

  const code = await readCode(file);

  const tokens = await tokenize(code);
  fs, writeFileSync("tokens.json", JSON.stringify(tokens, null, 2));

  const ast = await parse(tokens);
  fs.writeFileSync("ast.json", JSON.stringify(ast, null, 2));

  const env = await interpret(ast);

  const end = performance.now();
  const timeTaken = end - start;
  console.log("process took " + timeTaken + " milliseconds");
}

main("index.mimo");

// console.log("Code:", code);

// console.log("AST:", ast);
// console.log("Environment:", env);
