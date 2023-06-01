const ServerlessPrunePath = require('../src/index');
const fs = require('fs');
const path = require('path');
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
// Helper function to create a zip file in .serverless
async function createZipFile(directory, zipPath) {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip');

    archive.pipe(output);
    archive.directory(directory, false);
    await archive.finalize();
}
// helper function to unzip a file to a given path
async function unzipFile(zipPath, destinationPath) {
    const directory = await unzipper.Open.file(zipPath);
    await Promise.all(directory.files.map(async file => {
        const fullPath = path.join(destinationPath, file.path);
        const directoryName = path.dirname(fullPath);
        if (!fs.existsSync(directoryName)) {
            fs.mkdirSync(directoryName, { recursive: true });
        }

        // Check if file.path is a directory
        if (file.type === 'Directory') {
            // If it's a directory, create it if it doesn't already exist
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }
        } else {
            // If it's a file, create a file stream for it
            await pipeline(
                file.stream(),
                fs.createWriteStream(fullPath)
            );
        }
    }));
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
/**
 * Delete a directory and everything inside it.
 * @param {string} directoryPath The path of the directory to be deleted.
 */
function deleteDirectory(directoryPath) {
    if (fs.existsSync(directoryPath)) {
        fs.rmSync(directoryPath, { recursive: true });
    }
}
describe('ServerlessPrunePath plugin', () => {
    afterEach(() => {
        deleteDirectory(path.join(process.cwd(), '.serverless'));
    });
    let currentDirectory = process.cwd();
    describe('Successful scenarios', () => {
        describe('when lambda functions are not individually packed', () => {
            beforeEach(async () => {
                await createZippedFileStructure('.serverless/package.zip', {
                    'file1.txt': 'file1 content',
                    'node_modules': {
                        'file2.txt': 'file2 content',
                        'library': {
                            'file3.txt': 'file3 content',
                            'file4.txt': 'file4 content',
                            'file5.txt': 'file5 content'
                        },
                        'library2': {
                            'file6.txt': 'file6 content',
                            'file7.txt': 'file7 content',
                            'file8.txt': 'file8 content'
                        }
                    }
                });
            });
            describe('config: pathsToKeep.all', () => {
                it('should keep the specified file and remove all other unlisted files in the same directory of the given path', async () => {
                    const plugin = new ServerlessPrunePath({
                        cli: { log: jest.fn() },
                        config: { servicePath: process.cwd() },
                        service: {
                            custom: {
                                prunePath: {
                                    pathsToKeep: { all: ['./node_modules/library/file3.txt'] }
                                }
                            },
                            functions: {
                                function1: {}
                            }
                        }
                    });

                    await plugin.afterPackageFinalize();
                    let specificDirectory = '.serverless/package';
                    let fullPath = path.join(currentDirectory, specificDirectory);
                    await unzipFile(path.join(currentDirectory, '.serverless/package.zip'), path.join(currentDirectory, '.serverless/package')); //get this working
                    expect(fs.existsSync(path.join(currentDirectory, '.serverless/package.zip'))).toBeTruthy();
                    expect(fs.existsSync(path.join(fullPath, 'node_modules/library/file3.txt'))).toBeTruthy();
                    expect(fs.existsSync(path.join(fullPath, 'node_modules/library/file4.txt'))).toBeFalsy();
                    expect(fs.existsSync(path.join(fullPath, 'node_modules/library/file5.txt'))).toBeFalsy();
                    expect(fs.existsSync(path.join(fullPath, 'node_modules/library2/file6.txt'))).toBeTruthy();
                    expect(fs.existsSync(path.join(fullPath, 'node_modules/library2/file7.txt'))).toBeTruthy();
                    expect(fs.existsSync(path.join(fullPath, 'node_modules/library2/file8.txt'))).toBeTruthy();
                    expect(fs.existsSync(path.join(fullPath, 'file1.txt'))).toBeTruthy();
                    expect(fs.existsSync(path.join(fullPath, 'node_modules/file2.txt'))).toBeTruthy();

                });


            });


        });
        describe('when lambda functions are individually packed', () => {
            describe('all lambdas', () => {

            });
            describe('specific lambda', () => {

            });
        });
    });

    xdescribe('Failure scenarios', () => {
        test('Should throw error when no custom variables are given', async () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
                service: {
                    custom: {},
                    functions: {
                        function1: {}
                    }
                }
            });

            await expect(plugin.afterPackageFinalize()).rejects.toThrow("prunePath configuration is missing from custom");
        });

        test('Should throw error when the given key is not correct', async () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
                service: {
                    custom: {
                        prunePath: {
                            wrongKey: []
                        }
                    },
                    functions: {
                        function1: {}
                    }
                }
            });

            await expect(plugin.afterPackageFinalize()).rejects.toThrow("Invalid key(s) in prunePath: wrongKey");
        });
    });
});
