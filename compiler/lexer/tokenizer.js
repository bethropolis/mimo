import { processToken, processStringToken, processOperatorToken, isOperator } from './processToken.js';
import { PUNCTUATION } from './tokenTypes.js';

/**
 * @typedef {Object} Token
 * @property {string} type - The type of the token (e.g., 'number', 'identifier', 'operator', etc.).
 * @property {string} value - The value of the token (e.g., '42', 'x', '+', etc.).
 */

/**
 * Generate tokens from the given input.
 * @param {string} input - The input to be tokenized.
 * @returns {Token[]} An array of tokens.
 */
function generateTokens(input) {
    const tokens = [];
    let currentToken = "";
    let currentType = null;
    let inComment = false;
    let inString = false;

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
            ({ inString, currentToken } = processStringToken(inString, currentToken, tokens));
            continue;
        }

        if (inString) {
            currentToken += char;
            continue;
        }

        if (/\s/.test(char)) {
            ({ currentToken, currentType } = processToken(currentToken, currentType, tokens));
            continue;
        }

        if (isOperator(char)) {
            ({ currentToken, currentType, i } = processOperatorToken(char, i, input, currentType, currentToken, tokens));
        }else  if (PUNCTUATION.includes(char)) {
            ({ currentToken, currentType } = processToken(currentToken, currentType, tokens));
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

    ({ currentToken, currentType } = processToken(currentToken, currentType, tokens));
    return tokens;
}

export { generateTokens };