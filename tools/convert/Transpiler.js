import fs from 'node:fs';
import path from 'node:path';
import { Parser } from '../../parser/Parser.js';
import { Lexer } from '../../lexer/Lexer.js';

export class Transpiler {
    constructor() {
        this.processedFiles = new Set();
    }

    transpileMainFile(filePath, outPath, converterInfo) {
        console.log(` -> Transpiling: ${filePath}`);
        const source = fs.readFileSync(filePath, 'utf-8');
        const sourcePath = path.resolve(filePath);

        const output = this.transpileSource(source, sourcePath, converterInfo);
        fs.writeFileSync(outPath, output, 'utf-8');
    }

    transpileSource(source, sourcePath, converterInfo) {
        const lexer = new Lexer(source, sourcePath);
        const tokens = [];
        let token;
        while ((token = lexer.nextToken()) !== null) tokens.push(token);

        const parser = new Parser(tokens, sourcePath);
        const ast = parser.parse();

        const converter = new converterInfo.ConverterClass();
        return converter.convert(ast);
    }

    transpileFile(filePath, outDir, converterInfo, targetExtension) {
        if (this.processedFiles.has(filePath)) {
            return;
        }
        this.processedFiles.add(filePath);
        console.log(` -> Transpiling: ${filePath}`);

        const source = fs.readFileSync(filePath, 'utf-8');
        const sourcePath = path.resolve(filePath);

        const lexer = new Lexer(source, sourcePath);
        const tokens = [];
        let token;
        while ((token = lexer.nextToken()) !== null) tokens.push(token);

        const parser = new Parser(tokens, sourcePath);
        const ast = parser.parse();

        // After parsing, check for more imports to process
        ast.body.forEach(stmt => {
            if (stmt.type === 'ImportStatement') {
                const modulePath = stmt.path;
                if (!['fs', 'math', 'string', 'array', 'json', 'datetime'].includes(modulePath)) {
                    let nextFilePath = path.resolve(path.dirname(filePath), modulePath);
                    if (!nextFilePath.endsWith('.mimo')) {
                        nextFilePath += '.mimo';
                    }

                    if (fs.existsSync(nextFilePath)) {
                        this.transpileFile(nextFilePath, outDir, converterInfo, targetExtension);
                    } else {
                        console.warn(`Warning: Imported file not found, skipping: ${nextFilePath}`);
                    }
                }
            }
        });

        const converter = new converterInfo.ConverterClass();
        const output = converter.convert(ast);

        const baseName = path.basename(filePath, '.mimo');
        const outPath = path.join(outDir, `${baseName}${targetExtension}`);

        fs.writeFileSync(outPath, output, 'utf-8');
    }
}
