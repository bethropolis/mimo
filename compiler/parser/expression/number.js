
export function numberExpression(tokens, index){
    return {
        expression: {
        type: "literal",
        value: parseFloat(tokens[index++].value),
        },
        index,
    };
}