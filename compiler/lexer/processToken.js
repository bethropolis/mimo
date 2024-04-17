// processToken.js

import { OPERATORS } from "./tokenTypes.js";

export const isOperator = (char) => OPERATORS.includes(char);

export const processToken = (currentToken, currentType, tokens) => {
    if (currentToken) {
        tokens.push({ type: currentType, value: currentToken });
        return { currentToken: "", currentType: null };
    }
    return { currentToken, currentType };
};

export const processStringToken = (inString, currentToken, tokens) => {
    inString = !inString;
    if (!inString) {
        tokens.push({ type: "string", value: currentToken });
        currentToken = "";
    }
    return { inString, currentToken };
};

export const processOperatorToken = (char, index, input, currentType, currentToken, tokens) => {
    if (currentToken) {
        ({ currentToken, currentType } = processToken(currentToken, currentType, tokens));
    }

    
    currentType = "operator";
    currentToken += char;


    if (index < input.length - 1 && isOperator(input[index + 1])) {
        currentToken += input[index + 1];
        index++; // Skip the next operator character
    }
    tokens.push({ type: currentType, value: currentToken });
    return { currentToken: "", currentType: null, i:index };
};