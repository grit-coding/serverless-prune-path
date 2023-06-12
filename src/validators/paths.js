function validatePaths(pathsToKeep = {}, pathsToDelete = {}) {
    const uniqueKeepPaths = [...new Set(Object.values(pathsToKeep).flat())];
    const uniqueDeletePaths = [...new Set(Object.values(pathsToDelete).flat())];
    const keyWithEmptyValue = Object.entries(pathsToKeep).find(([key, value]) => !!key && value.length === 0) || Object.entries(pathsToDelete).find(([key, value]) => !!key && value.length === 0);
    if (keyWithEmptyValue) {
        throw new Error(`Empty value for key: ${keyWithEmptyValue[0]}`);
    }
    if (uniqueKeepPaths.includes('/') || uniqueDeletePaths.includes('/') || uniqueKeepPaths.includes('') || uniqueDeletePaths.includes('')) {
        throw new Error('Empty path or root path is not allowed');
    }
    const contradictions = [];

    // Check contradictions within keep paths
    uniqueKeepPaths.forEach((keepPath, i) => {
        uniqueKeepPaths.slice(i + 1).forEach(otherKeepPath => {
            if (otherKeepPath.startsWith(keepPath) || keepPath.startsWith(otherKeepPath)) {
                contradictions.push(`Keep: "${keepPath}", Keep: "${otherKeepPath}"`);
            }
        });
    });

    // Check contradictions between keep paths and delete paths
    uniqueKeepPaths.forEach(keepPath => {
        uniqueDeletePaths.forEach(deletePath => {
            if (keepPath.startsWith(deletePath)) {
                contradictions.push(`Keep: "${keepPath}", Delete: "${deletePath}"`);
            }
        });
    });

    return contradictions;
}

module.exports = validatePaths;