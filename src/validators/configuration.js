function validateConfiguration(custom, functions) {
    // Check if prunePath exists
    if (!custom || Object.keys(custom).includes('prunePath') === false) {
        throw new Error("prunePath configuration is missing from custom");
    }

    // Check if at least one of pathsToKeep or pathsToDelete exists
    if (!Object.keys(custom.prunePath).length || (!custom.prunePath.pathsToKeep && !custom.prunePath.pathsToDelete)) {
        throw new Error("At least one of pathsToKeep or pathsToDelete must exist in prunePath");
    }

    // Check for invalid keys
    const validKeys = ["pathsToKeep", "pathsToDelete"];
    const prunePathKeys = Object.keys(custom.prunePath);
    const invalidKeys = prunePathKeys.filter(key => !validKeys.includes(key));

    if (invalidKeys.length > 0) {
        throw new Error(`Invalid key(s) in prunePath: ${invalidKeys.join(", ")}`);
    }


    let pathsToKeepKeys = [];
    let pathsToDeleteKeys = [];
    if (custom.prunePath.pathsToKeep) {
        pathsToKeepKeys = Object.keys(custom.prunePath.pathsToKeep);
    }
    if (custom.prunePath.pathsToDelete) {
        pathsToDeleteKeys = Object.keys(custom.prunePath.pathsToDelete);
    }

    if (Array.isArray(custom.prunePath.pathsToKeep) || Array.isArray(custom.prunePath.pathsToDelete)) {
        throw new Error("pathsToKeep and pathsToDelete must contain the keyword \"all\""); //todo change next version

    }
    const keepAllWithFunc = pathsToKeepKeys.includes('all') && pathsToKeepKeys.length > 1;
    const deleteAllWithFunc = pathsToDeleteKeys.includes('all') && pathsToDeleteKeys.length > 1;

    if (keepAllWithFunc || deleteAllWithFunc) {
        throw new Error("The 'all' keyword in pathsToKeep or pathsToDelete cannot be used alongside specific function paths. Please use 'all' alone or specify individual functions.");
    }

    if (!functions) {
        throw new Error("No functions found in serverless service functions. Please add at least one function in the 'functions' section of your serverless.yml file.")
    }

    let functionNames = Object.keys(functions);

    if (functionNames.length === 0) {
        throw new Error("No functions found in serverless service functions. Please add at least one function in the 'functions' section of your serverless.yml file.");
    }

    let invalidFunctionNamesInKeep = pathsToKeepKeys.filter(
        functionName => !functionNames.includes(functionName) && functionName !== 'all'
    );
    let invalidFunctionNamesInDelete = pathsToDeleteKeys.filter(
        functionName => !functionNames.includes(functionName) && functionName !== 'all'
    );

    if (invalidFunctionNamesInKeep.length > 0) {
        throw new Error(`Invalid function name(s) in pathsToKeep: ${invalidFunctionNamesInKeep.join(", ")}`);
    }

    if (invalidFunctionNamesInDelete.length > 0) {
        throw new Error(`Invalid function name(s) in pathsToDelete: ${invalidFunctionNamesInDelete.join(", ")}`);
    }

}

module.exports = validateConfiguration;