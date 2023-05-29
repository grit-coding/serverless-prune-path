const mockFs = require('mock-fs');
const path = require('path');
const fs = require('fs');
const ServerlessPrunePath = require('../src/index');

const mockServicePathStructure = () => {
    return {
        '/servicePath': {
            '.serverless': {
                'unzipDir': {
                    'file1.txt': 'file1 content',
                    'node_modules': {
                        'file2.txt': 'file2 content',
                        'library': {
                            'file3.txt': 'file3 content',
                            'file4.txt': 'file4 content',
                            'file5.txt': 'file5 content'
                        }, 'library2': {
                            'file6.txt': 'file6 content',
                            'file7.txt': 'file7 content',
                            'file8.txt': 'file8 content'
                        }
                    }
                }
            }
        }
    };
};
describe('ServerlessPrunePath', () => {
    afterEach(() => {
        //Restore the real file system after each test.
        mockFs.restore();
    });
    describe('deleteListedFiles()', () => {
        it('should not remove anything from servicePath when no path is given', () => {
            mockFs(mockServicePathStructure());

            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteListedFiles([], unzipDir);

            expect(fs.existsSync(path.join(unzipDir, 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file5.txt'))).toBe(true);
        });

        it('should remove the given path', () => {
            mockFs(mockServicePathStructure());

            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });

            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteListedFiles(['node_modules/library/file3.txt'], unzipDir);

            expect(fs.existsSync(path.join(unzipDir, 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file3.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file5.txt'))).toBe(true);
        });

        it('should remove all the given paths', () => {
            mockFs(mockServicePathStructure());

            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });

            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteListedFiles(['node_modules/library/file3.txt', 'file1.txt', 'node_modules/file2.txt'], unzipDir);

            expect(fs.existsSync(path.join(unzipDir, 'file1.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/file2.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file3.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file5.txt'))).toBe(true);
        });

        it('should not remove anything when there is no matching path', () => {
            mockFs(mockServicePathStructure());

            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteListedFiles(['node_modules/wrong_path/file3.txt', 'wrong_file1.txt', 'node_modules/wrong_file2.txt'], unzipDir);

            expect(fs.existsSync(path.join(unzipDir, 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file5.txt'))).toBe(true);
        });
    });

    describe('deleteUnlistedFiles()', () => {
        it('should keep all the servicePath when no path is given', () => {
            mockFs(mockServicePathStructure());

            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });

            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteUnlistedFiles([], unzipDir);

            expect(fs.existsSync(path.join(unzipDir, 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file5.txt'))).toBe(true);
        });

        it('should keep the specified file and remove all other unlisted files in the same directory of the given path', () => {
            mockFs(mockServicePathStructure());

            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteUnlistedFiles(['node_modules/library/file3.txt'], unzipDir);

            expect(fs.existsSync(path.join(unzipDir, 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file4.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file5.txt'))).toBe(false);
        });

        it('should keep the specified files and remove all other unlisted files in the same directory of the given paths', () => {
            mockFs(mockServicePathStructure());

            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteUnlistedFiles(['node_modules/library/file3.txt', 'node_modules/library/file4.txt'], unzipDir);

            expect(fs.existsSync(path.join(unzipDir, 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file5.txt'))).toBe(false);
        });

        it('should keep the specified directory and remove all other unlisted files and directories in the same directory of the given path', () => {
            mockFs(mockServicePathStructure());

            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteUnlistedFiles(['node_modules/library'], unzipDir);

            expect(fs.existsSync(path.join(unzipDir, 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/file2.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file5.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library2'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library2/file6.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library2/file7.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library2/file8.txt'))).toBe(false);
        });

        it('should keep the specified file and remove all other unlisted files and directories in the same directory of the given path', () => {
            mockFs(mockServicePathStructure());

            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteUnlistedFiles(['node_modules/file2.txt'], unzipDir);

            expect(fs.existsSync(path.join(unzipDir, 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file3.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file4.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file5.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library2'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library2/file6.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library2/file7.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library2/file8.txt'))).toBe(false);
        });

        it('should keep the specified files and remove all other unlisted files in the same directory of the given path', () => {
            mockFs(mockServicePathStructure());

            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';

            plugin.deleteUnlistedFiles(['node_modules/library/file3.txt', 'node_modules/library2/file6.txt'], unzipDir);

            expect(fs.existsSync(path.join(unzipDir, 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file4.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file5.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library2/file6.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library2/file7.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library2/file8.txt'))).toBe(false);
        });

        it('should throw an error if the given path are not found', () => {
            mockFs(mockServicePathStructure());

            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            expect(() => {
                plugin.deleteUnlistedFiles(['node_modules/wrong_directory/file3.txt', 'node_modules/library2/wrong_file.txt'], unzipDir);
            }).toThrowError();

        });

        it('should throw an error if the given path case is incorrect', () => {
            mockFs(mockServicePathStructure());

            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            expect(() => {
                plugin.deleteUnlistedFiles(['node_modules/library/FILE3.txt'], unzipDir);
            }).toThrowError();

            expect(fs.existsSync(path.join(unzipDir, 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file5.txt'))).toBe(true);
        });
    });

    describe('findContradictoryPaths()', () => {
        it('should return contradictory paths when given', () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });

            const pathsToKeep = ['path/to/keep/fileToKeep.txt', 'another/path/to/keep'];
            const pathsToDelete = ['path/to/keep', 'another/path/to/delete'];

            const result = plugin.findContradictoryPaths(pathsToKeep, pathsToDelete);

            expect(result).toEqual(['Keep: "path/to/keep/fileToKeep.txt", Delete: "path/to/keep"']);
        });

        it('should return empty array when no contradictory paths are given', () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });

            const pathsToKeep = ['path/to/keep/fileToKeep.txt', 'another/path/to/keep'];
            const pathsToDelete = ['path/to/delete', 'another/path/to/delete'];

            const result = plugin.findContradictoryPaths(pathsToKeep, pathsToDelete);

            expect(result).toEqual([]);
        });
    });
});

