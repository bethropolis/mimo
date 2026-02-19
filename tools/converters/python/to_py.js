/**
 * The Mimo to Python transpiler.
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

export class MimoToPyConverter {
    constructor() {
        this.output = "";
        this.indentation = "    ";
        this.currentIndent = "";
        this.declaredVariables = new Set();
        this.moduleAliases = new Map();
        this.imports = new Set();
    }

    convert(ast) {
        // First pass to collect imports
        this.collectImports(ast);
        
        // Generate import statements
        this.output = `from mimo_runtime import mimo\n`;
        if (this.imports.size > 0) {
            this.imports.forEach(imp => {
                this.output += `${imp}\n`;
            });
        }
        this.output += `\n`;
        
        this.visitNode(ast);
        
        // Add main execution guard
        this.output += `\nif __name__ == "__main__":\n    pass\n`;
        
        return this.output;
    }

    collectImports(node) {
        if (!node) return;
        
        if (node.type === 'ImportStatement') {
            if (!['fs', 'math', 'string', 'array', 'json', 'datetime'].includes(node.path)) {
                const moduleName = node.path.endsWith('.mimo') ? node.path.replace('.mimo', '') : node.path;
                this.imports.add(`import ${moduleName} as ${node.alias}`);
            }
        }
        
        // Recursively check all properties
        for (const key in node) {
            const value = node[key];
            if (Array.isArray(value)) {
                value.forEach(item => this.collectImports(item));
            } else if (value && typeof value === 'object') {
                this.collectImports(value);
            }
        }
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
        if (line === "") {
            this.output += "\n";
        } else {
            this.output += this.currentIndent + line + "\n";
        }
    }

    visitNode(node) {
        if (!node || !node.type) return;
        const visitor = this[`visit${node.type}`];
        if (visitor) visitor.call(this, node);
        else
            console.warn(`[Python Converter] No visitor for AST node type: ${node.type}`);
    }

    visitBlock(statements) {
        if (statements.length === 0) {
            this.writeLine("pass");
            return;
        }
        this.indent();
        statements.forEach((stmt) => this.visitNode(stmt));
        this.dedent();
    }

    // --- Statement Visitors ---
    visitProgram(node) {
        node.body.forEach((stmt) => this.visitNode(stmt));
    }

    visitShowStatement(node) {
        this.write(`${this.currentIndent}mimo.show(`);
        this.visitNode(node.expression);
        this.write(")\n");
    }

    visitVariableDeclaration(node) {
        const globalPrefix = node.isExported ? 'global ' : '';
        if (node.isExported) {
            this.writeLine(`${globalPrefix}${node.identifier}`);
        }
        
        this.write(`${this.currentIndent}${node.identifier} = `);
        this.visitNode(node.value);
        this.write('\n');
        this.declaredVariables.add(node.identifier);
    }

    visitFunctionDeclaration(node) {
        const params = node.params.map(p => p.name).join(', ');
        
        this.writeLine(`def ${node.name}(${params}):`);
        this.visitBlock(node.body);
        this.writeLine();
        this.declaredVariables.add(node.name);
    }

    visitCallStatement(node) {
        if (node.destination) {
            const destName = node.destination.name;
            this.write(`${this.currentIndent}${destName} = `);
            this.declaredVariables.add(destName);
        } else {
            this.write(this.currentIndent);
        }

        this.visitCallee(node.callee);

        this.write(`(`);
        node.arguments.forEach((arg, i) => {
            this.visitNode(arg);
            if (i < node.arguments.length - 1) this.write(", ");
        });
        this.write(")\n");
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
        this.write("\n");
    }

    visitIfStatement(node) {
        this.write(`${this.currentIndent}if `);
        this.visitNode(node.condition);
        this.write(":\n");
        this.visitBlock(node.consequent);
        
        if (node.alternate) {
            if (node.alternate.type === "IfStatement") {
                this.write(`${this.currentIndent}el`);
                this.visitNode(node.alternate); // `elif` chain
            } else {
                this.writeLine("else:");
                this.visitBlock(node.alternate);
            }
        }
    }

    visitWhileStatement(node) {
        this.write(`${this.currentIndent}while `);
        this.visitNode(node.condition);
        this.write(":\n");
        this.visitBlock(node.body);
    }

    visitForStatement(node) {
        this.write(`${this.currentIndent}for ${node.variable.name} in `);
        this.visitNode(node.iterable);
        this.write(":\n");
        this.visitBlock(node.body);
    }

    visitTryStatement(node) {
        this.writeLine("try:");
        this.visitBlock(node.tryBlock);
        if (node.catchBlock) {
            this.writeLine(`except Exception as ${node.catchVar?.name || "_err"}:`);
            this.visitBlock(node.catchBlock);
        }
    }

    visitThrowStatement(node) {
        this.write(`${this.currentIndent}raise `);
        this.visitNode(node.argument);
        this.write("\n");
    }

    visitImportStatement(node) {
        this.moduleAliases.set(node.alias, node.path);
        
        if (['fs', 'math', 'string', 'array', 'json', 'datetime'].includes(node.path)) {
            this.writeLine(`${node.alias} = mimo.${node.path}`);
        } else {
            // Import was already handled in collectImports
            this.writeLine(`${node.alias} = ${node.alias}`);
        }
    }

    visitDestructuringAssignment(node) {
        this.write(`${this.currentIndent}`);
        this.visitNode(node.pattern);
        this.write(" = ");
        this.visitNode(node.expression);
        this.write("\n");
    }

    visitPropertyAssignment(node) {
        this.write(this.currentIndent);
        this.visitNode(node.object);
        this.write(`.${node.property} = `);
        this.visitNode(node.value);
        this.write("\n");
    }

    visitBracketAssignment(node) {
        this.write(this.currentIndent);
        this.visitNode(node.object);
        this.write("[");
        this.visitNode(node.index);
        this.write("] = ");
        this.visitNode(node.value);
        this.write("\n");
    }

    visitMatchStatement(node) {
        // Python doesn't have switch until 3.10, so we use if/elif chain
        const tempVar = `__match_val_${Math.floor(Math.random() * 1e6)}`;
        this.writeLine(`${tempVar} = `, false);
        this.visitNode(node.discriminant);
        this.write("\n");
        
        let first = true;
        node.cases.forEach((caseNode) => {
            this.visitCaseClause(caseNode, tempVar, first);
            first = false;
        });
    }

    visitCaseClause(node, matchVar, isFirst) {
        if (!node.pattern) {
            // default case
            this.writeLine("else:");
        } else {
            const prefix = isFirst ? "if " : "elif ";
            this.write(`${this.currentIndent}${prefix}`);
            this.generateMatchCondition(node.pattern, matchVar);
            this.write(":\n");
            this.indent();
            this.generateMatchBindings(node.pattern, matchVar);
            this.dedent();
        }
        this.visitBlock(node.consequent);
    }

    generateMatchCondition(pattern, matchVar) {
        if (pattern.type === "Literal") {
            this.write(`mimo.eq(${matchVar}, `);
            this.visitNode(pattern);
            this.write(")");
        } else if (pattern.type === "Identifier") {
            this.write("True");
        } else if (pattern.type === "ArrayPattern") {
            this.write(
                `isinstance(${matchVar}, list) and len(${matchVar}) == ${pattern.elements.length}`
            );
            pattern.elements.forEach((el, i) => {
                this.write(" and ");
                this.generateMatchCondition(el, `${matchVar}[${i}]`);
            });
        }
    }

    generateMatchBindings(pattern, matchVar) {
        if (pattern.type === "Identifier") {
            this.writeLine(`${pattern.name} = ${matchVar}`);
        } else if (pattern.type === "ArrayPattern") {
            pattern.elements.forEach((el, i) =>
                this.generateMatchBindings(el, `${matchVar}[${i}]`)
            );
        }
    }

    // --- Expression Visitors ---
    visitBinaryExpression(node) {
        const opMap = { 
            "=": "==", 
            "!=": "!=", 
            "and": "and", 
            "or": "or",
            "===": "==",
            "!==": "!="
        };
        const pyOp = opMap[node.operator] || node.operator;
        
        this.write("(");
        this.visitNode(node.left);
        this.write(` ${pyOp} `);
        this.visitNode(node.right);
        this.write(")");
    }

    visitUnaryExpression(node) {
        const opMap = { "!": "not ", "not": "not " };
        const pyOp = opMap[node.operator] || node.operator;
        this.write(`(${pyOp}`);
        this.visitNode(node.argument);
        this.write(")");
    }

    visitIdentifier(node) {
        this.write(node.name);
    }

    visitLiteral(node) {
        if (node.value === null) {
            this.write("None");
        } else if (node.value === true) {
            this.write("True");
        } else if (node.value === false) {
            this.write("False");
        } else if (typeof node.value === 'string') {
            // Use repr to properly escape strings
            this.write(JSON.stringify(node.value));
        } else {
            this.write(String(node.value));
        }
    }

    visitArrayLiteral(node) {
        this.write("[");
        node.elements.forEach((el, i) => {
            if (el.type === "SpreadElement") {
                this.write("*");
                this.visitNode(el.argument);
            } else {
                this.visitNode(el);
            }
            if (i < node.elements.length - 1) this.write(", ");
        });
        this.write("]");
    }

    visitObjectLiteral(node) {
        this.write("{");
        node.properties.forEach((prop, i) => {
            this.write(`"${prop.key}": `);
            this.visitNode(prop.value);
            if (i < node.properties.length - 1) this.write(", ");
        });
        this.write("}");
    }

    visitAnonymousFunction(node) {
        const params = node.params.map((p) => p.name).join(", ");
        
        // Python lambda for simple expressions, or define a nested function
        if (node.body.length === 1 && node.body[0].type === 'ReturnStatement') {
            this.write(`lambda ${params}: `);
            if (node.body[0].argument) {
                this.visitNode(node.body[0].argument);
            } else {
                this.write("None");
            }
        } else {
            // For complex functions, we need to create a nested function
            const funcName = `__lambda_${Math.floor(Math.random() * 1e6)}`;
            this.write(`(lambda: (\n`);
            this.writeLine(`def ${funcName}(${params}):`);
            this.visitBlock(node.body);
            this.writeLine(`return ${funcName}`);
            this.write(`${this.currentIndent})())`);
        }
    }

    visitModuleAccess(node) {
        this.write(`${node.module}.${node.property}`);
    }

    visitPropertyAccess(node) {
        this.visitNode(node.object);
        this.write(`.${node.property}`);
    }

    visitSafePropertyAccess(node) {
        this.write(`getattr(`);
        this.visitNode(node.object);
        this.write(`, "${node.property}", None)`);
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
        this.write("f\"");
        node.parts.forEach((part) => {
            if (part.type === "Literal") {
                // Escape quotes and braces in literal parts
                const escaped = part.value
                    .replace(/\\/g, "\\\\")
                    .replace(/"/g, '\\"')
                    .replace(/{/g, "{{")
                    .replace(/}/g, "}}");
                this.write(escaped);
            } else {
                this.write("{");
                this.visitNode(part);
                this.write("}");
            }
        });
        this.write("\"");
    }

    visitArrayPattern(node) {
        this.write(`[${node.elements.map((e) => e.name).join(", ")}]`);
        node.elements.forEach((e) => this.declaredVariables.add(e.name));
    }

    visitObjectPattern(node) {
        // Python doesn't have object destructuring like JS, so we simulate it
        const names = node.properties.map((p) => p.name);
        this.write(`[${names.join(", ")}]`);
        node.properties.forEach((p) => this.declaredVariables.add(p.name));
    }

    visitBreakStatement(node) {
        this.writeLine("break");
    }

    visitContinueStatement(node) {
        this.writeLine("continue");
    }

    visitLoopStatement(node) {
        if (node.label) {
            this.writeLine(`# Label: ${node.label}`);
        }
        this.writeLine("while True:");
        this.visitBlock(node.body);
    }

    visitLabeledStatement(node) {
        this.writeLine(`# Label: ${node.label}`);
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
