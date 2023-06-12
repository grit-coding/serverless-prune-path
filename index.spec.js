const mockFs = require('mock-fs');
const path = require('path');
const fs = require('fs');
const ServerlessPrunePath = require('./src/index');

describe('ServerlessPrunePath', () => {
    beforeEach(() => {
        //mock filesystem 
        mockFs({
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
        });
    });
    afterEach(() => {
        //Restore the real file system after each test.
        mockFs.restore();
    });

    describe('deleteListedFiles()', () => {
        it('should not remove anything from servicePath when no path is given', () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteListedFiles([], unzipDir);

            const shouldExist = [
                path.join(unzipDir, 'file1.txt'),
                path.join(unzipDir, 'node_modules/file2.txt'),
                path.join(unzipDir, 'node_modules/library/file3.txt'),
                path.join(unzipDir, 'node_modules/library/file4.txt'),
                path.join(unzipDir, 'node_modules/library/file5.txt'),

            ];

            shouldExist.forEach(filePath => {
                expect(fs.existsSync(filePath)).toBeTruthy();
            });
        });

        it('should remove the given path', () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteListedFiles(['node_modules/library/file3.txt'], unzipDir);

            const shouldExist = [
                path.join(unzipDir, 'file1.txt'),
                path.join(unzipDir, 'node_modules/file2.txt'),
                path.join(unzipDir, 'node_modules/library/file4.txt'),
                path.join(unzipDir, 'node_modules/library/file5.txt'),
            ];

            const shouldNotExist = [
                path.join(unzipDir, 'node_modules/library/file3.txt'),
            ];

            shouldExist.forEach(filePath => {
                expect(fs.existsSync(filePath)).toBeTruthy();
            });

            shouldNotExist.forEach(filePath => {
                expect(fs.existsSync(filePath)).toBeFalsy();
            });
        });

        it('should remove all the given paths', () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteListedFiles(['node_modules/library/file3.txt', 'file1.txt', 'node_modules/file2.txt'], unzipDir);

            const shouldExist = [
                path.join(unzipDir, 'node_modules/library/file4.txt'),
                path.join(unzipDir, 'node_modules/library/file5.txt'),
            ];

            const shouldNotExist = [
                path.join(unzipDir, 'file1.txt'),
                path.join(unzipDir, 'node_modules/file2.txt'),
                path.join(unzipDir, 'node_modules/library/file3.txt'),
            ];

            shouldExist.forEach(filePath => {
                expect(fs.existsSync(filePath)).toBeTruthy();
            });

            shouldNotExist.forEach(filePath => {
                expect(fs.existsSync(filePath)).toBeFalsy();
            });
        });

        it('should not remove anything when there is no matching path', () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteListedFiles(['node_modules/wrong_path/file3.txt', 'wrong_file1.txt', 'node_modules/wrong_file2.txt'], unzipDir);

            const shouldExist = [
                path.join(unzipDir, 'file1.txt'),
                path.join(unzipDir, 'node_modules/file2.txt'),
                path.join(unzipDir, 'node_modules/library/file3.txt'),
                path.join(unzipDir, 'node_modules/library/file4.txt'),
                path.join(unzipDir, 'node_modules/library/file5.txt'),
            ];

            shouldExist.forEach(filePath => {
                expect(fs.existsSync(filePath)).toBeTruthy();
            });
        });
    });

    describe('deleteUnlistedFiles()', () => {
        it('should keep all the servicePath when no path is given', () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteUnlistedFiles([], unzipDir);

            const shouldExist = [
                path.join(unzipDir, 'file1.txt'),
                path.join(unzipDir, 'node_modules/file2.txt'),
                path.join(unzipDir, 'node_modules/library/file3.txt'),
                path.join(unzipDir, 'node_modules/library/file4.txt'),
                path.join(unzipDir, 'node_modules/library/file5.txt'),
            ];

            shouldExist.forEach(filePath => {
                expect(fs.existsSync(filePath)).toBeTruthy();
            });
        });

        it('should keep the specified file and remove all other unlisted files in the same directory of the given path', () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteUnlistedFiles(['node_modules/library/file3.txt'], unzipDir);

            const shouldExist = [
                path.join(unzipDir, 'file1.txt'),
                path.join(unzipDir, 'node_modules/file2.txt'),
                path.join(unzipDir, 'node_modules/library/file3.txt'),
            ];

            const shouldNotExist = [
                path.join(unzipDir, 'node_modules/library/file4.txt'),
                path.join(unzipDir, 'node_modules/library/file5.txt'),
            ];

            shouldExist.forEach(filePath => {
                expect(fs.existsSync(filePath)).toBeTruthy();
            });

            shouldNotExist.forEach(filePath => {
                expect(fs.existsSync(filePath)).toBeFalsy();
            });
        });

        it('should keep the specified files and remove all other unlisted files in the same directory of the given paths', () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteUnlistedFiles(['node_modules/library/file3.txt', 'node_modules/library/file4.txt'], unzipDir);

            const shouldExist = [
                path.join(unzipDir, 'file1.txt'),
                path.join(unzipDir, 'node_modules/file2.txt'),
                path.join(unzipDir, 'node_modules/library/file3.txt'),
                path.join(unzipDir, 'node_modules/library/file4.txt')
            ];

            const shouldNotExist = [
                path.join(unzipDir, 'node_modules/library/file5.txt'),
            ];

            shouldExist.forEach(filePath => {
                expect(fs.existsSync(filePath)).toBeTruthy();
            });

            shouldNotExist.forEach(filePath => {
                expect(fs.existsSync(filePath)).toBeFalsy();
            });
        });

        it('should keep the specified directory and remove all other unlisted files and directories in the same directory of the given path', () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteUnlistedFiles(['node_modules/library'], unzipDir);

            const shouldExist = [
                path.join(unzipDir, 'file1.txt'),
                path.join(unzipDir, 'node_modules/library/file3.txt'),
                path.join(unzipDir, 'node_modules/library/file4.txt'),
                path.join(unzipDir, 'node_modules/library/file5.txt')
            ];

            const shouldNotExist = [
                path.join(unzipDir, 'node_modules/file2.txt'),
                path.join(unzipDir, 'node_modules/library2'),
                path.join(unzipDir, 'node_modules/library2/file6.txt'),
                path.join(unzipDir, 'node_modules/library2/file7.txt'),
                path.join(unzipDir, 'node_modules/library2/file8.txt'),
            ];

            shouldExist.forEach(filePath => {
                expect(fs.existsSync(filePath)).toBeTruthy();
            });

            shouldNotExist.forEach(filePath => {
                expect(fs.existsSync(filePath)).toBeFalsy();
            });

        });

        it('should keep the specified file and remove all other unlisted files and directories in the same directory of the given path', () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteUnlistedFiles(['node_modules/file2.txt'], unzipDir);

            const shouldExist = [
                path.join(unzipDir, 'file1.txt'),
                path.join(unzipDir, 'node_modules/file2.txt'),
            ];

            const shouldNotExist = [
                path.join(unzipDir, 'node_modules/library/file3.txt'),
                path.join(unzipDir, 'node_modules/library/file4.txt'),
                path.join(unzipDir, 'node_modules/library/file5.txt'),
                path.join(unzipDir, 'node_modules/library2'),
                path.join(unzipDir, 'node_modules/library2/file6.txt'),
                path.join(unzipDir, 'node_modules/library2/file7.txt'),
                path.join(unzipDir, 'node_modules/library2/file8.txt'),
            ];

            shouldExist.forEach(filePath => {
                expect(fs.existsSync(filePath)).toBeTruthy();
            });

            shouldNotExist.forEach(filePath => {
                expect(fs.existsSync(filePath)).toBeFalsy();
            });
        });

        it('should keep the specified files and remove all other unlisted files in the same directory of the given path', () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            plugin.deleteUnlistedFiles(['node_modules/library/file3.txt', 'node_modules/library2/file6.txt'], unzipDir);

            const shouldExist = [
                path.join(unzipDir, 'file1.txt'),
                path.join(unzipDir, 'node_modules/file2.txt'),
                path.join(unzipDir, 'node_modules/library/file3.txt'),
                path.join(unzipDir, 'node_modules/library2/file6.txt')
            ];

            const shouldNotExist = [
                path.join(unzipDir, 'node_modules/library/file4.txt'),
                path.join(unzipDir, 'node_modules/library/file5.txt'),
                path.join(unzipDir, 'node_modules/library2/file7.txt'),
                path.join(unzipDir, 'node_modules/library2/file8.txt'),
            ];

            shouldExist.forEach(filePath => {
                expect(fs.existsSync(filePath)).toBeTruthy();
            });

            shouldNotExist.forEach(filePath => {
                expect(fs.existsSync(filePath)).toBeFalsy();
            });
        });

        it('should throw an error if the given path are not found', () => {
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
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });
            const unzipDir = '/servicePath/.serverless/unzipDir';
            expect(() => {
                plugin.deleteUnlistedFiles(['node_modules/library/FILE3.txt'], unzipDir);
            }).toThrowError();

            const shouldExist = [
                path.join(unzipDir, 'file1.txt'),
                path.join(unzipDir, 'node_modules/file2.txt'),
                path.join(unzipDir, 'node_modules/library/file3.txt'),
                path.join(unzipDir, 'node_modules/library/file4.txt'),
                path.join(unzipDir, 'node_modules/library/file5.txt'),
            ];

            shouldExist.forEach(filePath => {
                expect(fs.existsSync(filePath)).toBeTruthy();
            });
        });
    });
});

