/**
 * The Mimo to JavaScript transpiler (Full Version).
 */

const CORE_BUILTINS = new Set([
    "len",
    "get",
    "update",
    "type",
    "push",
    "pop",
    "slice",
    "range",
    "join",
    "has_property",
    "keys",
    "values",
    "entries",
    "get_arguments",
    "get_env",
    "exit_code",
    "coalesce",
    "get_property_safe",
    "if_else",
]);


export class MimoToJsConverter {
    constructor() {
        this.output = "";
        this.indentation = "    ";
        this.currentIndent = "";
        this.declaredVariables = new Set();
        this.scopeStack = [new Set()];

        this.moduleAliases = new Map();
    }

    convert(ast) {
        this.output = `import { mimo } from './mimo_runtime.js';\n\n`;
        this.visitNode(ast);
        return this.output;
    }

    indent() {
        this.currentIndent += this.indentation;
    }
    dedent() {
        this.currentIndent = this.currentIndent.slice(0, -this.indentation.length);
    }
    write(text) {
        this.output += text;
    }
    writeLine(line = "") {
        this.output += this.currentIndent + line + "\n";
    }

    visitNode(node) {
        if (!node || !node.type) return;
        const visitor = this[`visit${node.type}`];
        if (visitor) visitor.call(this, node);
        else
            console.warn(`[JS Converter] No visitor for AST node type: ${node.type}`);
    }

    visitBlock(statements) {
        this.indent();
        statements.forEach((stmt) => this.visitNode(stmt));
        this.dedent();
    }

    escapeForTemplateLiteral(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\${/g, '\\${');
    }

    // --- Scope Management Helpers ---
    enterScope() {
        this.scopeStack.push(new Set());
    }

    exitScope() {
        this.scopeStack.pop();
    }

    declareVariable(name) {
        const currentScope = this.scopeStack[this.scopeStack.length - 1];
        currentScope.add(name);
    }

    isVariableDeclared(name) {
        for (let i = this.scopeStack.length - 1; i >= 0; i--) {
            if (this.scopeStack[i].has(name)) {
                return true;
            }
        }
        return false;
    }


    // --- Statement Visitors ---
    visitProgram(node) {
        node.body.forEach((stmt) => this.visitNode(stmt));
    }
    visitShowStatement(node) {
        this.write(`${this.currentIndent}mimo.show(`);
        this.visitNode(node.expression);
        this.write(");\n");
    }

    visitVariableDeclaration(node) {
        let declarationKeyword = 'let';
        if (node.kind === 'const') {
            declarationKeyword = 'const';
        }

        let fullPrefix = '';

        if (this.isVariableDeclared(node.identifier)) {
            fullPrefix = '';
        } else {
            if (node.isExported) {
                fullPrefix = `export ${declarationKeyword} `;
            } else {
                fullPrefix = `${declarationKeyword} `;
            }
            this.declareVariable(node.identifier);
        }

        this.write(`${this.currentIndent}${fullPrefix}${node.identifier} = `);
        this.visitNode(node.value);
        this.write(';\n');
    }

    visitFunctionDeclaration(node) {
        this.declareVariable(node.name);

        const exportPrefix = node.isExported ? 'export ' : '';
        this.write(`${this.currentIndent}${exportPrefix}function ${node.name}(`);

        this.enterScope();

        const paramNames = node.params.map(p => p.name);
        if (node.restParam) {
            paramNames.push(`...${node.restParam.name}`);
        }
        paramNames.forEach(pName => {
            this.declareVariable(pName.replace('...', ''));
        });

        this.write(paramNames.join(', '));
        this.write(') {\n');

        this.visitBlock(node.body);

        this.writeLine('}');

        this.exitScope();
    }

    visitCallStatement(node) {
        if (node.destination) {
            const destName = node.destination.name;
            const keyword = this.isVariableDeclared(destName) ? '' : 'let ';
            this.write(`${this.currentIndent}${keyword}${destName} = `);
            this.declareVariable(destName);
        } else {
            this.write(this.currentIndent);
        }

        this.visitCallee(node.callee);

        this.write(`(`);
        node.arguments.forEach((arg, i) => {
            this.visitNode(arg);
            if (i < node.arguments.length - 1) this.write(", ");
        });
        this.write(");\n");
    }

    visitCallee(calleeNode) {
        switch (calleeNode.type) {
            case "Identifier":
                if (CORE_BUILTINS.has(calleeNode.name)) {
                    this.write(`mimo.${calleeNode.name}`);
                } else {
                    this.visitNode(calleeNode);
                }
                break;

            case "ModuleAccess":
                this.visitNode(calleeNode);
                break;

            case "AnonymousFunction":
                this.visitNode(calleeNode);
                break;

            default:
                this.visitNode(calleeNode);
                break;
        }
    }

    visitReturnStatement(node) {
        this.write(`${this.currentIndent}return`);
        if (node.argument) {
            this.write(" ");
            this.visitNode(node.argument);
        }
        this.write(";\n");
    }

    visitIfStatement(node) {
        this.write(`${this.currentIndent}if (`);
        this.visitNode(node.condition);
        this.write(") {\n");
        this.visitBlock(node.consequent);
        if (node.alternate) {
            this.write(`${this.currentIndent}} else `);
            if (node.alternate.type === "IfStatement") {
                this.visitNode(node.alternate); // `else if` chain
            } else {
                this.write("{\n");
                this.visitBlock(node.alternate);
                this.writeLine("}");
            }
        } else {
            this.writeLine("}");
        }
    }

    visitWhileStatement(node) {
        this.write(`${this.currentIndent}while (`);
        this.visitNode(node.condition);
        this.write(") {\n");
        this.visitBlock(node.body);
        this.writeLine("}");
    }

    visitForStatement(node) {
        this.write(`${this.currentIndent}for (const ${node.variable.name} of `);
        this.visitNode(node.iterable);
        this.write(") {\n");
        this.visitBlock(node.body);
        this.writeLine("}");
    }

    visitTryStatement(node) {
        this.writeLine("try {");
        this.visitBlock(node.tryBlock);
        if (node.catchBlock) {
            this.write(
                `${this.currentIndent}} catch (${node.catchVar?.name || "_err"}) {\n`
            );
            this.visitBlock(node.catchBlock);
        }
        this.writeLine("}");
    }

    visitThrowStatement(node) {
        this.write(`${this.currentIndent}throw `);
        this.visitNode(node.argument);
        this.write(";\n");
    }

    visitImportStatement(node) {
        this.moduleAliases.set(node.alias, node.path);

        if (['fs', 'math', 'string', 'array', 'json', 'datetime'].includes(node.path)) {
            this.writeLine(`const ${node.alias} = mimo.${node.path};`);
        } else {
            const importPath = node.path.endsWith('.mimo') ? node.path.replace('.mimo', '.js') : `${node.path}.js`;
            this.writeLine(`import * as ${node.alias} from './${importPath}';`);
        }
    }

    visitDestructuringAssignment(node) {
        // Get all variable names from the pattern
        const patternVars = [];
        if (node.pattern.type === 'ArrayPattern') {
            node.pattern.elements.forEach(el => patternVars.push(el.name));
        } else if (node.pattern.type === 'ObjectPattern') {
            node.pattern.properties.forEach(prop => patternVars.push(prop.name));
        }

        // Check if any of these variables have been declared before
        const isReassignment = patternVars.some(v => this.isVariableDeclared(v));

        this.write(this.currentIndent);

        if (isReassignment) {
            // It's a re-assignment. Generate code without `let` or `const`.
            // Object destructuring assignment needs parentheses in JavaScript
            if (node.pattern.type === 'ObjectPattern') this.write('(');
        } else {
            // All variables are new. Declare them with `let`.
            this.write('let ');
        }

        this.visitNode(node.pattern);
        this.write(' = ');
        this.visitNode(node.expression);

        if (isReassignment && node.pattern.type === 'ObjectPattern') this.write(')');

        this.write(';\n');

        // Add all variables from this pattern to our set of declared variables.
        patternVars.forEach(v => this.declareVariable(v));
    }

    visitPropertyAssignment(node) {
        this.write(this.currentIndent);
        this.visitNode(node.object);
        this.write(`.${node.property} = `);
        this.visitNode(node.value);
        this.write(";\n");
    }

    visitBracketAssignment(node) {
        this.write(this.currentIndent);
        this.visitNode(node.object);
        this.write("[");
        this.visitNode(node.index);
        this.write("] = ");
        this.visitNode(node.value);
        this.write(";\n");
    }

    visitMatchStatement(node) {
        // We create a temporary variable for the value being matched
        const tempVar = `__match_val_${Math.floor(Math.random() * 1e6)}`;
        this.writeLine(`const ${tempVar} = `);
        this.visitNode(node.discriminant);
        this.write(";\n");
        this.writeLine(`switch (true) {`);
        this.indent();
        node.cases.forEach((caseNode) => this.visitCaseClause(caseNode, tempVar));
        this.dedent();
        this.writeLine("}");
    }

    visitCaseClause(node, matchVar) {
        if (!node.pattern) {
            // default case
            this.writeLine("default: {");
        } else {
            this.write(`${this.currentIndent}case (`);
            // Generate the matching condition
            this.generateMatchCondition(node.pattern, matchVar);
            this.write("): {\n");
            this.indent();
            // Generate variable bindings
            this.generateMatchBindings(node.pattern, matchVar);
            this.dedent();
        }
        this.visitBlock(node.consequent);
        this.writeLine("break;");
        this.writeLine("}");
    }

    generateMatchCondition(pattern, matchVar) {
        if (pattern.type === "Literal") {
            this.write(`mimo.eq(${matchVar}, `);
            this.visitNode(pattern);
            this.write(")");
        } else if (pattern.type === "Identifier") {
            this.write("true");
        } // Identifier always matches
        else if (pattern.type === "ArrayPattern") {
            this.write(
                `Array.isArray(${matchVar}) && ${matchVar}.length === ${pattern.elements.length}`
            );
            pattern.elements.forEach((el, i) => {
                this.write(" && ");
                this.generateMatchCondition(el, `${matchVar}[${i}]`);
            });
        }
    }
    generateMatchBindings(pattern, matchVar) {
        if (pattern.type === "Identifier") {
            this.writeLine(`const ${pattern.name} = ${matchVar};`);
        } else if (pattern.type === "ArrayPattern") {
            pattern.elements.forEach((el, i) =>
                this.generateMatchBindings(el, `${matchVar}[${i}]`)
            );
        }
    }

    // --- Expression Visitors ---
    visitBinaryExpression(node) {
        const opMap = { "=": "===", "!=": "!==", "!": "!==", and: "&&", or: "||" };
        const jsOp = opMap[node.operator] || node.operator;
        this.write("(");
        this.visitNode(node.left);
        this.write(` ${jsOp} `);
        this.visitNode(node.right);
        this.write(")");
    }
    visitUnaryExpression(node) {
        this.write(`(${node.operator}`);
        this.visitNode(node.argument);
        this.write(")");
    }
    visitIdentifier(node) {
        this.write(node.name);
    }
    visitLiteral(node) {
        this.write(JSON.stringify(node.value));
    }
    visitArrayLiteral(node) {
        this.write("[");
        node.elements.forEach((el, i) => {
            if (el.type === "SpreadElement") {
                this.write("...");
                this.visitNode(el.argument);
            } else {
                this.visitNode(el);
            }
            if (i < node.elements.length - 1) this.write(", ");
        });
        this.write("]");
    }
    visitObjectLiteral(node) {
        this.write("({");
        node.properties.forEach((prop, i) => {
            this.write(`${prop.key}: `);
            this.visitNode(prop.value);
            if (i < node.properties.length - 1) this.write(", ");
        });
        this.write("})");
    }
    visitAnonymousFunction(node) {
        this.enterScope();

        const paramNames = node.params.map(p => p.name);
        if (node.restParam) {
            paramNames.push(`...${node.restParam.name}`);
        }
        paramNames.forEach(pName => this.declareVariable(pName.replace('...', '')));

        this.write(`(${paramNames.join(', ')}) => {\n`);

        this.visitBlock(node.body);

        this.write(`${this.currentIndent}}`);

        this.exitScope();
    }
    visitModuleAccess(node) {
        this.write(`${node.module}.${node.property}`);
    }
    visitPropertyAccess(node) {
        this.visitNode(node.object);
        this.write(`.${node.property}`);
    }
    visitSafePropertyAccess(node) {
        this.visitNode(node.object);
        this.write(`?.${node.property}`);
    }
    visitArrayAccess(node) {
        this.visitNode(node.object);
        this.write(`[`);
        this.visitNode(node.index);
        this.write(`]`);
    }
    visitCallExpression(node) {
        this.visitCallee(node.callee);

        this.write("(");
        node.arguments.forEach((arg, i) => {
            this.visitNode(arg);
            if (i < node.arguments.length - 1) this.write(", ");
        });
        this.write(")");
    }

    visitTemplateLiteral(node) {
        this.write('`');
        node.parts.forEach(part => {
            if (part.type === 'Literal') {
                this.write(this.escapeForTemplateLiteral(part.value));
            } else {
                // Expressions inside ${...} are fine as they are
                this.write('${');
                this.visitNode(part);
                this.write('}');
            }
        });
        this.write('`');
    }
    visitArrayPattern(node) {
        this.write(`[${node.elements.map((e) => e.name).join(", ")}]`);
    }
    visitObjectPattern(node) {
        this.write(`{ ${node.properties.map((p) => p.name).join(", ")} }`);
    }
    visitBreakStatement(node) {
        this.write(`${this.currentIndent}break`);
        if (node.label) {
            this.write(` ${node.label}`);
        }
        this.write(";\n");
    }

    visitContinueStatement(node) {
        this.write(`${this.currentIndent}continue`);
        if (node.label) {
            this.write(` ${node.label}`);
        }
        this.write(";\n");
    }

    visitLoopStatement(node) {
        if (node.label) {
            this.writeLine(`${node.label}:`);
        }
        this.writeLine("while (true) {");
        this.visitBlock(node.body);
        this.writeLine("}");
    }

    visitLabeledStatement(node) {
        this.writeLine(`${node.label}:`);
        this.visitNode(node.statement);
    }

    visitRangeLiteral(node) {
        this.write("mimo.range(");
        this.visitNode(node.start);
        this.write(", ");
        this.visitNode(node.end);
        this.write(")");
    }
}
