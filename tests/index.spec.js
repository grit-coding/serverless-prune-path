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
    beforeEach(() => {
        //mock filesystem 
        mockFs(mockServicePathStructure());
    });
    afterEach(() => {
        //Restore the real file system after each test.
        mockFs.restore();
    });
    const plugin = new ServerlessPrunePath({
        cli: { log: jest.fn() },
        config: { servicePath: '/servicePath' },
    });
    const unzipDir = '/servicePath/.serverless/unzipDir';
    describe('deleteListedFiles()', () => {
        it('should not remove anything from servicePath when no path is given', () => {
            plugin.deleteListedFiles([], unzipDir);

            expect(fs.existsSync(path.join(unzipDir, 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file5.txt'))).toBe(true);
        });

        it('should remove the given path', () => {
            plugin.deleteListedFiles(['node_modules/library/file3.txt'], unzipDir);

            expect(fs.existsSync(path.join(unzipDir, 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file3.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file5.txt'))).toBe(true);
        });

        it('should remove all the given paths', () => {
            plugin.deleteListedFiles(['node_modules/library/file3.txt', 'file1.txt', 'node_modules/file2.txt'], unzipDir);

            expect(fs.existsSync(path.join(unzipDir, 'file1.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/file2.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file3.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file5.txt'))).toBe(true);
        });

        it('should not remove anything when there is no matching path', () => {
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
            plugin.deleteUnlistedFiles([], unzipDir);

            expect(fs.existsSync(path.join(unzipDir, 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file5.txt'))).toBe(true);
        });

        it('should keep the specified file and remove all other unlisted files in the same directory of the given path', () => {
            plugin.deleteUnlistedFiles(['node_modules/library/file3.txt'], unzipDir);

            expect(fs.existsSync(path.join(unzipDir, 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file4.txt'))).toBe(false);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file5.txt'))).toBe(false);
        });

        it('should keep the specified files and remove all other unlisted files in the same directory of the given paths', () => {
            plugin.deleteUnlistedFiles(['node_modules/library/file3.txt', 'node_modules/library/file4.txt'], unzipDir);

            expect(fs.existsSync(path.join(unzipDir, 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join(unzipDir, 'node_modules/library/file5.txt'))).toBe(false);
        });

        it('should keep the specified directory and remove all other unlisted files and directories in the same directory of the given path', () => {
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
            expect(() => {
                plugin.deleteUnlistedFiles(['node_modules/wrong_directory/file3.txt', 'node_modules/library2/wrong_file.txt'], unzipDir);
            }).toThrowError();
        });

        it('should throw an error if the given path case is incorrect', () => {
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
            const pathsToKeep = { all: ['path/to/keep/fileToKeep.txt', 'another/path/to/keep'] };
            const pathsToDelete = { all: ['path/to/keep', 'another/path/to/delete'] };

            const result = plugin.findContradictoryPaths(pathsToKeep, pathsToDelete);

            expect(result).toEqual(['Keep: "path/to/keep/fileToKeep.txt", Delete: "path/to/keep"']);
        });

        it('should return empty array when no contradictory paths are given', () => {
            const pathsToKeep = { all: ['path/to/keep/fileToKeep.txt', 'another/path/to/keep'] };
            const pathsToDelete = { all: ['path/to/delete', 'another/path/to/delete'] };

            const result = plugin.findContradictoryPaths(pathsToKeep, pathsToDelete);

            expect(result).toEqual([]);
        });
    });

    describe('validateCustomVariables()', () => {
        it('should throw error when prunePath configuration is missing from custom', () => {
            const custom = {};

            expect(() => plugin.validateCustomVariables(custom)).toThrow("prunePath configuration is missing from custom");
        });

        it('should throw error when invalid keys are present in prunePath', () => {
            const custom = {
                prunePath: {
                    invalidKey: [],
                    pathsToKeep: []
                }
            };

            expect(() => plugin.validateCustomVariables(custom)).toThrow("Invalid key(s) in prunePath: invalidKey");
        });

        it('should throw error when both pathsToKeep and pathsToDelete are missing in prunePath', () => {
            const custom = {
                prunePath: {}
            };

            expect(() => plugin.validateCustomVariables(custom)).toThrow("At least one of pathsToKeep or pathsToDelete must exist in prunePath");
        });

        it('should throw error when function path is specified with "all" in pathsToKeep', () => {
            const custom = {
                prunePath: {
                    pathsToKeep: {
                        all: [],
                        someFunction: []
                    }
                }
            };

            expect(() => plugin.validateCustomVariables(custom)).toThrow("The 'all' keyword in pathsToKeep or pathsToDelete cannot be used alongside specific function paths. Please use 'all' alone or specify individual functions.");
        });

        it('should throw error when function path is specified with "all" in pathsToDelete', () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });

            const custom = {
                prunePath: {
                    pathsToDelete: {
                        all: [],
                        someFunction: []
                    }
                }
            };

            expect(() => plugin.validateCustomVariables(custom)).toThrow("The 'all' keyword in pathsToKeep or pathsToDelete cannot be used alongside specific function paths. Please use 'all' alone or specify individual functions.");
        });

        it('should throw error when invalid function name is given in pathsToKeep', () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
                service: {
                    custom: {
                        prunePath: {
                            pathsToKeep: {
                                invalidFunctionName: ['./node_modules/luxon/package.json']
                            }
                        }
                    },
                    functions: {
                        validFunctionName: {}
                    }
                }
            });

            expect(() => plugin.validateCustomVariables(plugin.serverless.service.custom))
                .toThrow('Invalid function name(s) in pathsToKeep: invalidFunctionName');
        });

        it('should throw error when invalid function name is given in pathsToDelete', () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
                service: {
                    custom: {
                        prunePath: {
                            pathsToDelete: {
                                invalidFunctionName: ['./node_modules/luxon/package.json']
                            }
                        }
                    },
                    functions: {
                        validFunctionName: {}
                    }
                }
            });

            expect(() => plugin.validateCustomVariables(plugin.serverless.service.custom))
                .toThrow('Invalid function name(s) in pathsToDelete: invalidFunctionName');
        });

        it('should not throw error when valid function name is given in pathsToKeep', () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
                service: {
                    custom: {
                        prunePath: {
                            pathsToKeep: {
                                validFunctionName: ['./node_modules/luxon/package.json']
                            }
                        }
                    },
                    functions: {
                        validFunctionName: {}
                    }
                }
            });

            expect(() => plugin.validateCustomVariables(plugin.serverless.service.custom))
                .not.toThrow();
        });

        it('should not throw error when valid function name is given in pathsToDelete', () => {
            const plugin = new ServerlessPrunePath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
                service: {
                    custom: {
                        prunePath: {
                            pathsToDelete: {
                                validFunctionName: ['./node_modules/luxon/package.json']
                            }
                        }
                    },
                    functions: {
                        validFunctionName: {}
                    }
                }
            });

            expect(() => plugin.validateCustomVariables(plugin.serverless.service.custom))
                .not.toThrow();
        });
    });

});

