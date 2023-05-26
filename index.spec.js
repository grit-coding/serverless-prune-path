const mockFs = require('mock-fs');
const path = require('path');
const fs = require('fs');
const ServerlessPruneNodeModulesPath = require('./index');

describe('ServerlessPruneNodeModulesPath', () => {
    afterEach(() => {
        //Restore the real file system after each test.
        mockFs.restore();
    });

    test('flat folder', () => {
        mockFs({
            '/servicePath': {
                'file1.txt': 'file1 content',
                'file2.txt': 'file2 content',
                'file3.txt': 'file3 content',
            },
        });

        const plugin = new ServerlessPruneNodeModulesPath({
            cli: { log: jest.fn() },
            config: { servicePath: '/servicePath' },
        });

        plugin.deletePaths(['file1.txt', 'file3.txt']);

        expect(fs.existsSync(path.join('/servicePath', 'file1.txt'))).toBe(false);
        expect(fs.existsSync(path.join('/servicePath', 'file2.txt'))).toBe(true);
        expect(fs.existsSync(path.join('/servicePath', 'file3.txt'))).toBe(false);
    });

    test('nested folders', () => {
        mockFs({
            '/servicePath': {
                'file1.txt': 'file1 content',
                'folder1': {
                    'file2.txt': 'file2 content',
                    'subfolder1': {
                        'file3.txt': 'file3 content'
                    }
                }
            }
        });

        const plugin = new ServerlessPruneNodeModulesPath({
            cli: { log: jest.fn() },
            config: { servicePath: '/servicePath' },
        });

        plugin.deletePaths(['file1.txt', 'folder1/subfolder1/file3.txt']);

        expect(fs.existsSync(path.join('/servicePath', 'file1.txt'))).toBe(false);
        expect(fs.existsSync(path.join('/servicePath', 'folder1/file2.txt'))).toBe(true);
        expect(fs.existsSync(path.join('/servicePath', 'folder1/subfolder1/file3.txt'))).toBe(false);
    });
});