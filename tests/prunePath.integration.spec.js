const ServerlessPrunePath = require('../src/index');
const mockFs = require('mock-fs');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

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
//Helper function to unzip file after prune process in .serverless

describe('ServerlessPrunePath integration tests', () => {
    beforeEach(async () => {
        mockFs({
            '/servicePath/.serverless': {}
        });

        // Create a mock zip file
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

    afterEach(mockFs.restore);

    describe('customVariables', () => {
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

        test('Should throw error when wrong config key is given', async () => {
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

    //all functions
    //per function
});
