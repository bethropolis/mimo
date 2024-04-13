export function stringExpression(tokens, index){
    return {
        expression: { type: "literal", value: tokens[index++].value },
        index,
    };
}
