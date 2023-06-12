const mockFs = require('mock-fs');
const path = require('path');
const fs = require('fs');
const processPathsToKeep = require('./paths-to-keep');

describe('processPathsToKeep()', () => {
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
    it('should keep all the servicePath when no path is given', () => {
        const unzipDir = '/servicePath/.serverless/unzipDir';
        processPathsToKeep([], unzipDir, { cli: { log: jest.fn() } });

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
        const unzipDir = '/servicePath/.serverless/unzipDir';
        processPathsToKeep(['node_modules/library/file3.txt'], unzipDir, { cli: { log: jest.fn() } });

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

        const unzipDir = '/servicePath/.serverless/unzipDir';
        processPathsToKeep(['node_modules/library/file3.txt', 'node_modules/library/file4.txt'], unzipDir, { cli: { log: jest.fn() } });

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

        const unzipDir = '/servicePath/.serverless/unzipDir';
        processPathsToKeep(['node_modules/library'], unzipDir, { cli: { log: jest.fn() } });

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

        const unzipDir = '/servicePath/.serverless/unzipDir';
        processPathsToKeep(['node_modules/file2.txt'], unzipDir, { cli: { log: jest.fn() } });

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

        const unzipDir = '/servicePath/.serverless/unzipDir';
        processPathsToKeep(['node_modules/library/file3.txt', 'node_modules/library2/file6.txt'], unzipDir, { cli: { log: jest.fn() } });

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

        const unzipDir = '/servicePath/.serverless/unzipDir';
        expect(() => {
            processPathsToKeep(['node_modules/wrong_directory/file3.txt', 'node_modules/library2/wrong_file.txt'], unzipDir, { cli: { log: jest.fn() } });
        }).toThrowError();
    });

    it('should throw an error if the given path case is incorrect', () => {

        const unzipDir = '/servicePath/.serverless/unzipDir';
        expect(() => {
            processPathsToKeep(['node_modules/library/FILE3.txt'], unzipDir, { cli: { log: jest.fn() } });
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


