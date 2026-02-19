// interpreter/evaluators/templateLiteralEvaluator.js

import { stringify } from '../Utils.js';

export function evaluateTemplateLiteral(interpreter, node) {
    let resultString = "";
    
    for (const part of node.parts) {
        if (part.type === 'Literal') {
            // This is a string fragment from the template
            resultString += part.value;
        } else {
            // This is an interpolated expression - evaluate it and stringify
            const value = interpreter.visitNode(part);
            resultString += stringify(value);
        }
    }
    
    return resultString;
}
