const ServerlessPrunePath = require('../src/index');
const mockFs = require('mock-fs');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');
const unzipper = require('unzipper');
const promisify = require('util').promisify;
const pipeline = promisify(require('stream').pipeline);

// Helper function to create a zip file in .serverless
async function createZipFile(zipPath, fileStructure) {
    function createDirStructure(basePath, structure) {
        Object.keys(structure).forEach((key) => {
            const item = structure[key];
            const itemPath = path.join(basePath, key);
            if (typeof item === 'object') {
                fs.mkdirSync(itemPath);
                createDirStructure(itemPath, item);
            } else {
                fs.writeFileSync(itemPath, item);
            }
        });
    }

    const tmpDir = path.join(path.dirname(zipPath), 'tmp');
    fs.mkdirSync(tmpDir);
    createDirStructure(tmpDir, fileStructure);

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip');

    archive.pipe(output);
    archive.directory(tmpDir, false);
    await archive.finalize();

    fs.rmSync(tmpDir, { recursive: true });
}
// helper function to unzip a file to a given path
async function unzipFile(zipPath, destinationPath) {
    const directory = await unzipper.Open.file(zipPath);
    await Promise.all(directory.files.map(file =>
        pipeline(
            file.stream(),
            fs.createWriteStream(path.join(destinationPath, file.path))
        )
    ));
}


xdescribe('ServerlessPrunePath plugin', () => {
    beforeEach(async () => {
        mockFs({
            '/servicePath/.serverless': {}
        });
    });

    afterEach(mockFs.restore);

    describe('Successful scenarios', () => {
        describe('when lambda functions are not individually packed', () => {
            beforeEach(async () => {
                await createZipFile('/servicePath/.serverless/package.zip', {
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
            it('should prune specified paths with valid configuration', async () => {
                const plugin = new ServerlessPrunePath({
                    cli: { log: jest.fn() },
                    config: { servicePath: '/servicePath' },
                    service: {
                        custom: {
                            prunePath: {
                                pathsToKeep: { all: ['./node_modules/library/file3.txt'] }
                            }
                        }
                    }
                });

                await plugin.afterPackageFinalize();
                await unzipFile('/servicePath/.serverless/package.zip', '/servicePath/.serverless/package');
                expect(fs.existsSync('/servicePath/.serverless/package.zip')).toBeTruthy();
                expect(fs.existsSync('/servicePath/.serverless/package/node_modules/library/file3.txt')).toBeTruthy();
                expect(fs.existsSync('/servicePath/.serverless/package/node_modules/library/file4.txt')).toBeFalsy();
                expect(fs.existsSync('/servicePath/.serverless/package/node_modules/library/file5.txt')).toBeFalsy();
                expect(fs.existsSync('/servicePath/.serverless/package/node_modules/library2/file6.txt')).toBeTruthy();
                expect(fs.existsSync('/servicePath/.serverless/package/node_modules/library2/file7.txt')).toBeTruthy();
                expect(fs.existsSync('/servicePath/.serverless/package/node_modules/library2/file8.txt')).toBeTruthy();
                expect(fs.existsSync('/servicePath/.serverless/package/file1.txt')).toBeTruthy();
                expect(fs.existsSync('/servicePath/.serverless/package/node_modules/file2.txt')).toBeTruthy();

            });

        });
        describe('when lambda functions are individually packed', () => {
            describe('all lambdas', () => {

            });
            describe('specific lambda', () => {

            });
        });
    });

    describe('Failure scenarios', () => {
        test('Should throw error when no custom variables are given', async () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
                service: {
                    custom: {}
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
                    }
                }
            });

            await expect(plugin.afterPackageFinalize()).rejects.toThrow("Invalid key(s) in prunePath: wrongKey");
        });
    });
});
