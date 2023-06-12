const path = require('path');
const fs = require('fs');

function deleteUnlistedFiles(pathsToKeep, unzipDir, serverless) {
    const keepFilesSet = new Set(pathsToKeep.map(filePath => path.join(unzipDir, filePath)));

    const invalidPath = [...keepFilesSet].find(path => {
        const fileExist = fs.existsSync(path) === false;
        if (fileExist) {
            const realPath = fs.realpathSync(path);
            if (realPath !== path) {
                serverless.cli.log(`Case does not match for: ${path}. Real path: ${realPath}`);
                return true;
            }
        }
        return false;
    });

    if (invalidPath?.length) {
        throw new Error(`File not found: ${invalidPath}`);
    }

    // check if all pathsToKeep values existing path. if not throw an error.
    let targetDirectoriesToPrune = [...keepFilesSet].map(file => path.dirname(file));

    // Remove duplicate directories and sort them so that directories near the root come first.
    targetDirectoriesToPrune = [...new Set(targetDirectoriesToPrune)].sort((a, b) => {
        const aDepth = a.split(path.sep).length;
        const bDepth = b.split(path.sep).length;
        return aDepth - bDepth;
    });

    targetDirectoriesToPrune.forEach(dir => {
        fs.readdirSync(dir, { withFileTypes: true }).forEach(file => {
            const fullPath = path.join(dir, file.name);

            if (!keepFilesSet.has(fullPath)) {
                if (file.isDirectory()) {
                    // Recursively delete directory if it's not in the keep list.
                    fs.rmSync(fullPath, { recursive: true });
                    serverless.cli.log(`Deleted directory: ${fullPath}`);
                } else {
                    // Delete file if it's not in the keep list.
                    fs.unlinkSync(fullPath);
                    serverless.cli.log(`Deleted file: ${fullPath}`);
                }
            }
        });
    });
}

module.exports = deleteUnlistedFiles;