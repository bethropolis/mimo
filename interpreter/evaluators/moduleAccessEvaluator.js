
export function evaluateModuleAccess(interpreter, node) {
    // A module alias is now just a regular variable in the environment.
    // The `import` statement defines it as a constant object.
    const moduleObject = interpreter.currentEnv.lookup(node.module);

    if (typeof moduleObject !== 'object' || moduleObject === null) {
        throw interpreter.errorHandler.createRuntimeError(
            `Cannot access property on non-module/non-object '${node.module}'.`,
            node.module, 'TYPE002'
        );
    }

    // Check if property exists in the module's exports object.
    if (!Object.prototype.hasOwnProperty.call(moduleObject, node.property)) {
        const availableProps = Object.keys(moduleObject).sort();
        throw interpreter.errorHandler.createRuntimeError(
            `Property '${node.property}' not found in module '${node.module}'.`,
            node, 'MOD002',
            `Available properties in '${node.module}': ${availableProps.join(', ')}`
        );
    }

    return moduleObject[node.property];
}