const ServerlessPrunePath = require('../../src/index');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const archiver = require('archiver');
const exp = require('constants');
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
    describe('Successful scenarios', () => {
        afterEach(() => {
            deleteDirectory(path.join(process.cwd(), '.serverless'));
        });
        let currentDirectory = process.cwd();
        describe('when lambda functions are packed together', () => {
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
            describe('config: pathsToKeep', () => {
                describe('all', () => {
                    it('should keep the specified path and remove all other unlisted files in the same directory of the given path', async () => {
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
                        let packageDirectory = '.serverless/package';
                        let packageFullPath = path.join(currentDirectory, packageDirectory);
                        await unzipFile(path.join(currentDirectory, '.serverless/package.zip'), path.join(currentDirectory, packageDirectory));
                        expect(fs.existsSync(path.join(currentDirectory, '.serverless/package.zip'))).toBeTruthy();

                        const shouldExist = [
                            path.join(packageFullPath, 'node_modules/library/file3.txt'),
                            path.join(packageFullPath, 'node_modules/library2/file6.txt'),
                            path.join(packageFullPath, 'node_modules/library2/file7.txt'),
                            path.join(packageFullPath, 'node_modules/library2/file8.txt'),
                            path.join(packageFullPath, 'file1.txt'),
                            path.join(packageFullPath, 'node_modules/file2.txt'),
                        ];

                        const shouldNotExist = [
                            path.join(packageFullPath, 'node_modules/library/file4.txt'),
                            path.join(packageFullPath, 'node_modules/library/file5.txt'),
                        ];

                        shouldExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeTruthy();
                        });

                        shouldNotExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeFalsy();
                        });
                    });

                    it('should keep the specified paths and remove all other unlisted files in the same directory of the given path', async () => {
                        const plugin = new ServerlessPrunePath({
                            cli: { log: jest.fn() },
                            config: { servicePath: process.cwd() },
                            service: {
                                custom: {
                                    prunePath: {
                                        pathsToKeep: { all: ['./node_modules/library/file3.txt', './node_modules/library2/file6.txt'] }
                                    }
                                },
                                functions: {
                                    function1: {}
                                }
                            }
                        });

                        await plugin.afterPackageFinalize();
                        let packageDirectory = '.serverless/package';
                        let packageFullPath = path.join(currentDirectory, packageDirectory);
                        await unzipFile(path.join(currentDirectory, '.serverless/package.zip'), path.join(currentDirectory, packageDirectory));
                        expect(fs.existsSync(path.join(currentDirectory, '.serverless/package.zip'))).toBeTruthy();

                        const shouldExist = [
                            path.join(packageFullPath, 'node_modules/library/file3.txt'),
                            path.join(packageFullPath, 'node_modules/library2/file6.txt'),
                            path.join(packageFullPath, 'file1.txt'),
                            path.join(packageFullPath, 'node_modules/file2.txt'),
                        ];

                        const shouldNotExist = [
                            path.join(packageFullPath, 'node_modules/library/file4.txt'),
                            path.join(packageFullPath, 'node_modules/library/file5.txt'),
                            path.join(packageFullPath, 'node_modules/library2/file7.txt'),
                            path.join(packageFullPath, 'node_modules/library2/file8.txt'),
                        ];

                        shouldExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeTruthy();
                        });

                        shouldNotExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeFalsy();
                        });
                    });

                });
            });
            describe('config: pathsToDelete', () => {
                describe('all', () => {
                    it('should remove the specified path and keep all other files in the same directory of the given path', async () => {
                        const plugin = new ServerlessPrunePath({
                            cli: { log: jest.fn() },
                            config: { servicePath: process.cwd() },
                            service: {
                                custom: {
                                    prunePath: {
                                        pathsToDelete: { all: ['./node_modules/library/file3.txt'] }
                                    }
                                },
                                functions: {
                                    function1: {}
                                }
                            }
                        });

                        await plugin.afterPackageFinalize();
                        let packageDirectory = '.serverless/package';
                        let packageFullPath = path.join(currentDirectory, packageDirectory);
                        await unzipFile(path.join(currentDirectory, '.serverless/package.zip'), path.join(currentDirectory, packageDirectory));
                        expect(fs.existsSync(path.join(currentDirectory, '.serverless/package.zip'))).toBeTruthy();

                        const shouldExist = [
                            path.join(packageFullPath, 'node_modules/library/file4.txt'),
                            path.join(packageFullPath, 'node_modules/library/file5.txt'),
                            path.join(packageFullPath, 'node_modules/library2/file6.txt'),
                            path.join(packageFullPath, 'node_modules/library2/file7.txt'),
                            path.join(packageFullPath, 'node_modules/library2/file8.txt'),
                            path.join(packageFullPath, 'file1.txt'),
                            path.join(packageFullPath, 'node_modules/file2.txt'),
                        ];

                        const shouldNotExist = [
                            path.join(packageFullPath, 'node_modules/library/file3.txt'),
                        ];

                        shouldExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeTruthy();
                        });

                        shouldNotExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeFalsy();
                        });
                    });

                    it('should remove the specified paths and keep all other files in the same directory of the given path', async () => {
                        const plugin = new ServerlessPrunePath({
                            cli: { log: jest.fn() },
                            config: { servicePath: process.cwd() },
                            service: {
                                custom: {
                                    prunePath: {
                                        pathsToDelete: { all: ['./node_modules/library/file3.txt', 'file1.txt', 'node_modules/file2.txt'] }
                                    }
                                },
                                functions: {
                                    function1: {}
                                }
                            }
                        });

                        await plugin.afterPackageFinalize();
                        let packageDirectory = '.serverless/package';
                        let packageFullPath = path.join(currentDirectory, packageDirectory);
                        await unzipFile(path.join(currentDirectory, '.serverless/package.zip'), path.join(currentDirectory, packageDirectory));
                        expect(fs.existsSync(path.join(currentDirectory, '.serverless/package.zip'))).toBeTruthy();

                        const shouldExist = [
                            path.join(packageFullPath, 'node_modules/library/file4.txt'),
                            path.join(packageFullPath, 'node_modules/library/file5.txt'),
                            path.join(packageFullPath, 'node_modules/library2/file6.txt'),
                            path.join(packageFullPath, 'node_modules/library2/file7.txt'),
                            path.join(packageFullPath, 'node_modules/library2/file8.txt'),
                        ];

                        const shouldNotExist = [
                            path.join(packageFullPath, 'node_modules/library/file3.txt'),
                            path.join(packageFullPath, 'file1.txt'),
                            path.join(packageFullPath, 'node_modules/file2.txt'),
                        ];

                        shouldExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeTruthy();
                        });

                        shouldNotExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeFalsy();
                        });
                    });

                });
            });
            describe('config: pathsToKeep && pathsToDelete', () => {
                describe('all', () => {
                    it('should keep the specified path and remove all other unlisted files in the same directory of the given path also remove the specified path and keep all other files in the same directory of the given path ', async () => {
                        const plugin = new ServerlessPrunePath({
                            cli: { log: jest.fn() },
                            config: { servicePath: process.cwd() },
                            service: {
                                custom: {
                                    prunePath: {
                                        pathsToKeep: { all: ['./node_modules/library/file3.txt'] },
                                        pathsToDelete: { all: ['./node_modules/library2/file6.txt'] }
                                    }
                                },
                                functions: {
                                    function1: {}
                                }
                            }
                        });

                        await plugin.afterPackageFinalize();
                        let packageDirectory = '.serverless/package';
                        let packageFullPath = path.join(currentDirectory, packageDirectory);
                        await unzipFile(path.join(currentDirectory, '.serverless/package.zip'), path.join(currentDirectory, packageDirectory));
                        expect(fs.existsSync(path.join(currentDirectory, '.serverless/package.zip'))).toBeTruthy();

                        const shouldExist = [
                            path.join(packageFullPath, 'node_modules/library/file3.txt'),

                            path.join(packageFullPath, 'node_modules/library2/file7.txt'),
                            path.join(packageFullPath, 'node_modules/library2/file8.txt'),
                            path.join(packageFullPath, 'file1.txt'),
                            path.join(packageFullPath, 'node_modules/file2.txt'),
                        ];

                        const shouldNotExist = [
                            path.join(packageFullPath, 'node_modules/library/file4.txt'),
                            path.join(packageFullPath, 'node_modules/library/file5.txt'),
                            path.join(packageFullPath, 'node_modules/library2/file6.txt'),

                        ];

                        shouldExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeTruthy();
                        });

                        shouldNotExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeFalsy();
                        });
                    });

                    it('should keep the specified paths and remove all other unlisted files in the same directory of the given path also remove the specified paths and keep all other files in the same directory of the given path ', async () => {
                        const plugin = new ServerlessPrunePath({
                            cli: { log: jest.fn() },
                            config: { servicePath: process.cwd() },
                            service: {
                                custom: {
                                    prunePath: {
                                        pathsToKeep: { all: ['./node_modules/library/file3.txt', './node_modules/library2/file6.txt'] },
                                        pathsToDelete: { all: ['node_modules/file2.txt', 'file1.txt'] }
                                    }
                                },
                                functions: {
                                    function1: {}
                                }
                            }
                        });

                        await plugin.afterPackageFinalize();
                        let packageDirectory = '.serverless/package';
                        let packageFullPath = path.join(currentDirectory, packageDirectory);
                        await unzipFile(path.join(currentDirectory, '.serverless/package.zip'), path.join(currentDirectory, packageDirectory));
                        expect(fs.existsSync(path.join(currentDirectory, '.serverless/package.zip'))).toBeTruthy();

                        const shouldExist = [
                            path.join(packageFullPath, 'node_modules/library/file3.txt'),
                            path.join(packageFullPath, 'node_modules/library2/file6.txt'),
                        ];

                        const shouldNotExist = [
                            path.join(packageFullPath, 'node_modules/library/file4.txt'),
                            path.join(packageFullPath, 'node_modules/library/file5.txt'),
                            path.join(packageFullPath, 'node_modules/library2/file7.txt'),
                            path.join(packageFullPath, 'node_modules/library2/file8.txt'),
                            path.join(packageFullPath, 'node_modules/file2.txt'),
                            path.join(packageFullPath, 'file1.txt'),
                        ];

                        shouldExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeTruthy();
                        });

                        shouldNotExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeFalsy();
                        });
                    });

                });
            });
        });
        describe('when lambda functions are individually packed', () => {
            beforeEach(async () => {
                await createZippedFileStructure('.serverless/function1.zip', {
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
                await createZippedFileStructure('.serverless/function2.zip', {
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
            describe('config: pathsToKeep', () => {
                describe('all', () => {
                    it('should keep the specified path and remove all other unlisted files in the same directory of the given path', async () => {
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

                        let function1Directory = path.join('.serverless', 'function1');
                        let function2Directory = path.join('.serverless', 'function2');
                        const function1UnzipPath = path.join(currentDirectory, function1Directory);
                        const function2UnzipPath = path.join(currentDirectory, function2Directory);

                        await unzipFile(path.join(currentDirectory, '.serverless', 'function1.zip'), function1UnzipPath);
                        await unzipFile(path.join(currentDirectory, '.serverless', 'function2.zip'), function2UnzipPath);

                        const shouldExist = [
                            path.join(currentDirectory, '.serverless/function1.zip'),
                            path.join(currentDirectory, '.serverless/function2.zip'),
                            path.join(function1UnzipPath, 'node_modules/library/file3.txt'),
                            path.join(function2UnzipPath, 'node_modules/library/file3.txt'),
                            path.join(function1UnzipPath, 'node_modules/library2/file6.txt'),
                            path.join(function2UnzipPath, 'node_modules/library2/file6.txt'),
                            path.join(function1UnzipPath, 'node_modules/library2/file7.txt'),
                            path.join(function2UnzipPath, 'node_modules/library2/file7.txt'),
                            path.join(function1UnzipPath, 'node_modules/library2/file8.txt'),
                            path.join(function2UnzipPath, 'node_modules/library2/file8.txt'),
                            path.join(function1UnzipPath, 'file1.txt'),
                            path.join(function2UnzipPath, 'file1.txt'),
                            path.join(function1UnzipPath, 'node_modules/file2.txt'),
                            path.join(function2UnzipPath, 'node_modules/file2.txt'),
                        ];

                        const shouldNotExist = [
                            path.join(function1UnzipPath, 'node_modules/library/file4.txt'),
                            path.join(function2UnzipPath, 'node_modules/library/file4.txt'),
                            path.join(function1UnzipPath, 'node_modules/library/file5.txt'),
                            path.join(function2UnzipPath, 'node_modules/library/file5.txt'),
                        ];

                        shouldExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeTruthy();
                        });

                        shouldNotExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeFalsy();
                        });
                    });
                    it('should keep the specified paths and remove all other unlisted files in the same directory of the given path', async () => {
                        const plugin = new ServerlessPrunePath({
                            cli: { log: jest.fn() },
                            config: { servicePath: process.cwd() },
                            service: {
                                custom: {
                                    prunePath: {
                                        pathsToKeep: { all: ['./node_modules/library/file3.txt', './node_modules/library2/file6.txt'] }
                                    }
                                },
                                functions: {
                                    function1: {}
                                }
                            }
                        });

                        await plugin.afterPackageFinalize();

                        let function1Directory = path.join('.serverless', 'function1');
                        let function2Directory = path.join('.serverless', 'function2');
                        const function1UnzipPath = path.join(currentDirectory, function1Directory);
                        const function2UnzipPath = path.join(currentDirectory, function2Directory);

                        await unzipFile(path.join(currentDirectory, '.serverless', 'function1.zip'), function1UnzipPath);
                        await unzipFile(path.join(currentDirectory, '.serverless', 'function2.zip'), function2UnzipPath);

                        const shouldExist = [
                            path.join(currentDirectory, '.serverless/function1.zip'),
                            path.join(currentDirectory, '.serverless/function2.zip'),
                            path.join(function1UnzipPath, 'node_modules/library/file3.txt'),
                            path.join(function2UnzipPath, 'node_modules/library/file3.txt'),
                            path.join(function1UnzipPath, 'node_modules/library2/file6.txt'),
                            path.join(function2UnzipPath, 'node_modules/library2/file6.txt'),
                            path.join(function1UnzipPath, 'file1.txt'),
                            path.join(function2UnzipPath, 'file1.txt'),
                            path.join(function1UnzipPath, 'node_modules/file2.txt'),
                            path.join(function2UnzipPath, 'node_modules/file2.txt'),
                        ];

                        const shouldNotExist = [
                            path.join(function1UnzipPath, 'node_modules/library/file4.txt'),
                            path.join(function2UnzipPath, 'node_modules/library/file4.txt'),
                            path.join(function1UnzipPath, 'node_modules/library/file5.txt'),
                            path.join(function2UnzipPath, 'node_modules/library/file5.txt'),
                            path.join(function1UnzipPath, 'node_modules/library2/file7.txt'),
                            path.join(function2UnzipPath, 'node_modules/library2/file7.txt'),
                            path.join(function1UnzipPath, 'node_modules/library2/file8.txt'),
                            path.join(function2UnzipPath, 'node_modules/library2/file8.txt'),
                        ];

                        shouldExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeTruthy();
                        });

                        shouldNotExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeFalsy();
                        });
                    });
                });
            });
            describe('config: pathsToDelete', () => {
                describe('all', () => {
                    it('should remove the specified path and keep all other files in the same directory of the given path', async () => {
                        const plugin = new ServerlessPrunePath({
                            cli: { log: jest.fn() },
                            config: { servicePath: process.cwd() },
                            service: {
                                custom: {
                                    prunePath: {
                                        pathsToDelete: { all: ['./node_modules/library/file3.txt'] }
                                    }
                                },
                                functions: {
                                    function1: {}
                                }
                            }
                        });

                        await plugin.afterPackageFinalize();

                        let function1Directory = path.join('.serverless', 'function1');
                        let function2Directory = path.join('.serverless', 'function2');
                        const function1UnzipPath = path.join(currentDirectory, function1Directory);
                        const function2UnzipPath = path.join(currentDirectory, function2Directory);

                        await unzipFile(path.join(currentDirectory, '.serverless', 'function1.zip'), function1UnzipPath);
                        await unzipFile(path.join(currentDirectory, '.serverless', 'function2.zip'), function2UnzipPath);

                        const shouldExist = [
                            path.join(currentDirectory, '.serverless/function1.zip'),
                            path.join(currentDirectory, '.serverless/function2.zip'),
                            path.join(function1UnzipPath, 'node_modules/library/file4.txt'),
                            path.join(function2UnzipPath, 'node_modules/library/file4.txt'),
                            path.join(function1UnzipPath, 'node_modules/library/file5.txt'),
                            path.join(function2UnzipPath, 'node_modules/library/file5.txt'),
                            path.join(function1UnzipPath, 'node_modules/library2/file6.txt'),
                            path.join(function2UnzipPath, 'node_modules/library2/file6.txt'),
                            path.join(function1UnzipPath, 'node_modules/library2/file7.txt'),
                            path.join(function2UnzipPath, 'node_modules/library2/file7.txt'),
                            path.join(function1UnzipPath, 'node_modules/library2/file8.txt'),
                            path.join(function2UnzipPath, 'node_modules/library2/file8.txt'),
                            path.join(function1UnzipPath, 'file1.txt'),
                            path.join(function2UnzipPath, 'file1.txt'),
                            path.join(function1UnzipPath, 'node_modules/file2.txt'),
                            path.join(function2UnzipPath, 'node_modules/file2.txt'),
                        ];

                        const shouldNotExist = [
                            path.join(function1UnzipPath, 'node_modules/library/file3.txt'),
                            path.join(function2UnzipPath, 'node_modules/library/file3.txt'),
                        ];

                        shouldExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeTruthy();
                        });

                        shouldNotExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeFalsy();
                        });
                    });
                    it('should remove the specified paths and keep all other files in the same directory of the given path', async () => {
                        const plugin = new ServerlessPrunePath({
                            cli: { log: jest.fn() },
                            config: { servicePath: process.cwd() },
                            service: {
                                custom: {
                                    prunePath: {
                                        pathsToDelete: { all: ['./node_modules/library/file3.txt', './node_modules/library2/file6.txt', 'file1.txt'] }
                                    }
                                },
                                functions: {
                                    function1: {}
                                }
                            }
                        });

                        await plugin.afterPackageFinalize();

                        let function1Directory = path.join('.serverless', 'function1');
                        let function2Directory = path.join('.serverless', 'function2');
                        const function1UnzipPath = path.join(currentDirectory, function1Directory);
                        const function2UnzipPath = path.join(currentDirectory, function2Directory);

                        await unzipFile(path.join(currentDirectory, '.serverless', 'function1.zip'), function1UnzipPath);
                        await unzipFile(path.join(currentDirectory, '.serverless', 'function2.zip'), function2UnzipPath);

                        const shouldExist = [
                            path.join(currentDirectory, '.serverless/function1.zip'),
                            path.join(currentDirectory, '.serverless/function2.zip'),
                            path.join(function1UnzipPath, 'node_modules/library/file4.txt'),
                            path.join(function2UnzipPath, 'node_modules/library/file4.txt'),
                            path.join(function1UnzipPath, 'node_modules/library/file5.txt'),
                            path.join(function2UnzipPath, 'node_modules/library/file5.txt'),

                            path.join(function1UnzipPath, 'node_modules/library2/file7.txt'),
                            path.join(function2UnzipPath, 'node_modules/library2/file7.txt'),
                            path.join(function1UnzipPath, 'node_modules/library2/file8.txt'),
                            path.join(function2UnzipPath, 'node_modules/library2/file8.txt'),

                            path.join(function1UnzipPath, 'node_modules/file2.txt'),
                            path.join(function2UnzipPath, 'node_modules/file2.txt'),
                        ];

                        const shouldNotExist = [
                            path.join(function1UnzipPath, 'file1.txt'),
                            path.join(function2UnzipPath, 'file1.txt'),
                            path.join(function1UnzipPath, 'node_modules/library/file3.txt'),
                            path.join(function2UnzipPath, 'node_modules/library/file3.txt'),
                            path.join(function1UnzipPath, 'node_modules/library2/file6.txt'),
                            path.join(function2UnzipPath, 'node_modules/library2/file6.txt'),
                        ];

                        shouldExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeTruthy();
                        });

                        shouldNotExist.forEach(filePath => {
                            expect(fs.existsSync(filePath)).toBeFalsy();
                        });
                    });
                });
            });

        });
    });

    describe('Failing scenarios', () => {
        describe('when functions are not defined', () => {
            it('it should throw an error', async () => {
                const plugin = new ServerlessPrunePath({
                    cli: { log: jest.fn() },
                    config: { servicePath: process.cwd() },
                    service: {
                        custom: {
                            prunePath: {
                                pathsToKeep: { all: ['./node_modules/library/file3.txt'] }
                            }
                        },
                        // Note: functions are missing
                    }
                });

                await expect(plugin.afterPackageFinalize()).rejects.toThrow("No functions found in serverless service functions. Please add at least one function in the 'functions' section of your serverless.yml file.");
            });

            it('and service.functions are empty, it should throw an error', async () => {
                const plugin = new ServerlessPrunePath({
                    cli: { log: jest.fn() },
                    config: { servicePath: process.cwd() },
                    service: {
                        custom: {
                            prunePath: {
                                pathsToKeep: { all: ['./node_modules/library/file3.txt'] }
                            }
                        },
                        functions: {}
                    }
                });
                await expect(plugin.afterPackageFinalize()).rejects.toThrow("No functions found in serverless service functions. Please add at least one function in the 'functions' section of your serverless.yml file.");
            });
        });

        describe('when configuration is invalid', () => {
            it('custom missing: should throw an error', async () => {
                const plugin = new ServerlessPrunePath({
                    cli: { log: jest.fn() },
                    config: { servicePath: process.cwd() },
                    service: {
                        // Note: custom is missing
                        functions: {
                            function1: {}
                        }
                    }
                });

                await expect(plugin.afterPackageFinalize()).rejects.toThrow("prunePath configuration is missing from custom");
            });

            it('prunePath missing: should throw an error', async () => {
                const plugin = new ServerlessPrunePath({
                    cli: { log: jest.fn() },
                    config: { servicePath: process.cwd() },
                    service: {
                        custom: {},
                        functions: {
                            function1: {}
                        }
                    }
                });

                await expect(plugin.afterPackageFinalize()).rejects.toThrow("prunePath configuration is missing from custom");
            });

            it('empty prunePath: should throw an error', async () => {
                const plugin = new ServerlessPrunePath({
                    cli: { log: jest.fn() },
                    config: { servicePath: process.cwd() },
                    service: {
                        custom: {
                            prunePath: {}
                        },
                        functions: {
                            function1: {}
                        }
                    }
                });

                await expect(plugin.afterPackageFinalize()).rejects.toThrow("At least one of pathsToKeep or pathsToDelete must exist in prunePath");
            });

            it('invalid prunPath keys: should throw an error', async () => {
                const plugin = new ServerlessPrunePath({
                    cli: { log: jest.fn() },
                    config: { servicePath: process.cwd() },
                    service: {
                        custom: {
                            prunePath: {
                                // Note: invalid prunePath keys
                                pathsToKeep: {},
                                wrongKey: {},
                                wrongKey2: {}
                            }
                        },
                        functions: {
                            function1: {}
                        }
                    }
                });

                await expect(plugin.afterPackageFinalize()).rejects.toThrow("Invalid key(s) in prunePath: wrongKey, wrongKey2");
            });

            it('all key missing: should throw an error', async () => {
                const plugin = new ServerlessPrunePath({
                    cli: { log: jest.fn() },
                    config: { servicePath: process.cwd() },
                    service: {
                        custom: {
                            prunePath: {
                                pathsToKeep: ['paths'], // Note: all key missing

                            }
                        },
                        functions: {
                            function1: {}
                        }
                    }
                });

                await expect(plugin.afterPackageFinalize()).rejects.toThrow("pathsToKeep and pathsToDelete must contain the keyword \"all\"");
            });

            it('empty all: should throw an error', async () => {
                const plugin = new ServerlessPrunePath({
                    cli: { log: jest.fn() },
                    config: { servicePath: process.cwd() },
                    service: {
                        custom: {
                            prunePath: {
                                pathsToKeep: { all: [] }

                            }
                        },
                        functions: {
                            function1: {}
                        }
                    }
                });

                await expect(plugin.afterPackageFinalize()).rejects.toThrow("Empty value for key: all");
            });

        });

        describe('when paths are invalid', () => {
            it('global path: should throw an error', async () => {
                const plugin = new ServerlessPrunePath({
                    cli: { log: jest.fn() },
                    config: { servicePath: process.cwd() },
                    service: {
                        custom: {
                            prunePath: {
                                pathsToDelete: { all: [''] }
                            }
                        },
                        functions: {
                            function1: {}
                        }
                    }
                });
                const plugin2 = new ServerlessPrunePath({
                    cli: { log: jest.fn() },
                    config: { servicePath: process.cwd() },
                    service: {
                        custom: {
                            prunePath: {
                                pathsToDelete: { all: ['/'] }
                            }
                        },
                        functions: {
                            function1: {}
                        }
                    }
                });

                await expect(plugin.afterPackageFinalize()).rejects.toThrow("Empty path or root path is not allowed");
                await expect(plugin2.afterPackageFinalize()).rejects.toThrow("Empty path or root path is not allowed");
            });

            it('contradiction within pathsToKeep: should throw an error', async () => {
                const plugin = new ServerlessPrunePath({
                    cli: { log: jest.fn() },
                    config: { servicePath: process.cwd() },
                    service: {
                        custom: {
                            prunePath: {
                                pathsToKeep: { all: ['path/to/keep', 'path/to/keep/file1.txt'] }
                            }
                        },
                        functions: {
                            function1: {}
                        }
                    }
                });

                await expect(plugin.afterPackageFinalize()).rejects.toThrow("Contradictory paths found: Keep: \"path/to/keep\", Keep: \"path/to/keep/file1.txt\"");

            });

            it('contradiction file path from pathsToKeep and pathsToDelete: should throw an error', async () => {
                const plugin = new ServerlessPrunePath({
                    cli: { log: jest.fn() },
                    config: { servicePath: process.cwd() },
                    service: {
                        custom: {
                            prunePath: {
                                pathsToKeep: { all: ['path/file1.txt'] },
                                pathsToDelete: { all: ['path/file1.txt'] }
                            }
                        },
                        functions: {
                            function1: {}
                        }
                    }
                });

                await expect(plugin.afterPackageFinalize()).rejects.toThrow("Contradictory paths found: Keep: \"path/file1.txt\", Delete: \"path/file1.txt\"");

            });

            it('contradiction file path and directory from pathsToKeep and pathsToDelete: should throw an error', async () => {
                const plugin = new ServerlessPrunePath({
                    cli: { log: jest.fn() },
                    config: { servicePath: process.cwd() },
                    service: {
                        custom: {
                            prunePath: {
                                pathsToKeep: { all: ['path/file1.txt'] },
                                pathsToDelete: { all: ['path'] }
                            }
                        },
                        functions: {
                            function1: {}
                        }
                    }
                });

                await expect(plugin.afterPackageFinalize()).rejects.toThrow("Contradictory paths found: Keep: \"path/file1.txt\", Delete: \"path\"");

            });

        });


    });
});
