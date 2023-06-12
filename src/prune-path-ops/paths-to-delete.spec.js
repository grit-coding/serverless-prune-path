const mockFs = require('mock-fs');
const path = require('path');
const fs = require('fs');
const processPathsToDelete = require('./paths-to-delete');

describe('processPathsToDelete()', () => {
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
    it('should not remove anything from servicePath when no path is given', () => {

        const unzipDir = '/servicePath/.serverless/unzipDir';
        processPathsToDelete([], unzipDir, { cli: { log: jest.fn() } });

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
        const unzipDir = '/servicePath/.serverless/unzipDir';
        processPathsToDelete(['node_modules/library/file3.txt'], unzipDir, { cli: { log: jest.fn() } });

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
        const unzipDir = '/servicePath/.serverless/unzipDir';
        processPathsToDelete(['node_modules/library/file3.txt', 'file1.txt', 'node_modules/file2.txt'], unzipDir, { cli: { log: jest.fn() } });

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
        const unzipDir = '/servicePath/.serverless/unzipDir';
        processPathsToDelete(['node_modules/wrong_path/file3.txt', 'wrong_file1.txt', 'node_modules/wrong_file2.txt'], unzipDir, { cli: { log: jest.fn() } });

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