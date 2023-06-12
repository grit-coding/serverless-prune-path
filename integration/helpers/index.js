const path = require('path');
const fs = require('fs');
const unzipper = require('unzipper');
const archiver = require('archiver');
const promisify = require('util').promisify;
const pipeline = promisify(require('stream').pipeline);
/**
 * Create a file structure based on an object where keys represent paths
 * and values represent file contents.
 * @param {string} basePath The base directory where the files will be created.
 * @param {Object} fileStructure An object describing the file structure.
 */
function createFileStructure(basePath, fileStructure) {
    Object.entries(fileStructure).forEach(([filePath, content]) => {
        const fullPath = path.join(basePath, filePath);
        const dirName = path.dirname(fullPath);
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true });
        }
        if (typeof content === 'object') {
            createFileStructure(fullPath, content);
        } else {
            fs.writeFileSync(fullPath, content);
        }
    });
}

async function createZipFile(directory, zipPath) {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip');

    archive.pipe(output);
    archive.directory(directory, false);
    await archive.finalize();
}

async function createZippedFileStructure(zipPath, fileStructure) {
    // Create the file structure in a temporary directory
    const tmpDir = path.join(path.dirname(zipPath), 'tmp');
    fs.mkdirSync(tmpDir, { recursive: true });
    createFileStructure(tmpDir, fileStructure);

    // Zip the file structure
    await createZipFile(tmpDir, zipPath);

    // Remove the temporary directory
    fs.rmSync(tmpDir, { recursive: true });
}

async function unzipFile(zipPath, destinationPath) {
    const directory = await unzipper.Open.file(zipPath);
    const basePath = path.resolve(process.cwd(), path.dirname(zipPath));

    await Promise.all(directory.files.map(async file => {
        let filePath = file.path;

        // Remove the shared initial substring between filePath and basePath
        if (filePath.startsWith(basePath)) {
            filePath = filePath.substring(basePath.length);
        }

        const fullPath = path.join(destinationPath, filePath);
        const directoryName = path.dirname(fullPath);

        if (!fs.existsSync(directoryName)) {
            fs.mkdirSync(directoryName, { recursive: true });
        }

        if (file.type === 'Directory') {
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }
        } else {
            await pipeline(
                file.stream(),
                fs.createWriteStream(fullPath)
            );
        }
    }));
}

/**
 * Delete a directory and everything inside it.
 * @param {string} directoryPath The path of the directory to be deleted.
 */
function deleteDirectory(directoryPath) {
    if (fs.existsSync(directoryPath)) {
        fs.rmSync(directoryPath, { recursive: true });
    }
}

module.exports = {
    deleteDirectory,
    createZippedFileStructure,
    unzipFile,
};