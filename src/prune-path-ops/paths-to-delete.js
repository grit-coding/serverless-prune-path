const path = require('path');
const fs = require('fs');

function deleteListedFiles(pathsToDelete, unzipDir, serverless) {
    pathsToDelete.forEach((deletePath) => {
        const fullPath = path.join(unzipDir, deletePath);

        if (fs.existsSync(fullPath)) {
            if (fs.lstatSync(fullPath).isDirectory()) {
                // Recursive deletion of directory if it exists
                fs.rmSync(fullPath, { recursive: true });
                serverless.cli.log(`Deleted directory: ${fullPath}`);
            } else {
                // File deletion
                fs.unlinkSync(fullPath);
                serverless.cli.log(`Deleted: ${fullPath}`);
            }
        } else {
            serverless.cli.log(`File not found: ${fullPath}`);
        }
    });
}

module.exports = deleteListedFiles;