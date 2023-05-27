const mockFs = require('mock-fs');
const path = require('path');
const fs = require('fs');
const ServerlessPruneNodeModulesPath = require('./index');

describe('ServerlessPruneNodeModulesPath', () => {
    afterEach(() => {
        //Restore the real file system after each test.
        mockFs.restore();
    });
    describe('deleteListedFiles', () => {
        it('should not remove anything from servicePath when no path is given', () => {
            mockFs({
                '/servicePath': {
                    'file1.txt': 'file1 content',
                    'node_modules': {
                        'file2.txt': 'file2 content',
                        'custom_library': {
                            'file3.txt': 'file3 content',
                            'file4.txt': 'file4 content',
                            'file5.txt': 'file5 content'
                        }
                    }
                }
            });

            const plugin = new ServerlessPruneNodeModulesPath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });

            plugin.deleteListedFiles([]);

            expect(fs.existsSync(path.join('/servicePath', 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file5.txt'))).toBe(true);
        });

        it('should remove the given path', () => {
            mockFs({
                '/servicePath': {
                    'file1.txt': 'file1 content',
                    'node_modules': {
                        'file2.txt': 'file2 content',
                        'custom_library': {
                            'file3.txt': 'file3 content',
                            'file4.txt': 'file4 content',
                            'file5.txt': 'file5 content'
                        }
                    }
                }
            });

            const plugin = new ServerlessPruneNodeModulesPath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });

            plugin.deleteListedFiles(['node_modules/custom_library/file3.txt']);

            expect(fs.existsSync(path.join('/servicePath', 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file3.txt'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file5.txt'))).toBe(true);
        });

        it('should remove all the given paths', () => {
            mockFs({
                '/servicePath': {
                    'file1.txt': 'file1 content',
                    'node_modules': {
                        'file2.txt': 'file2 content',
                        'custom_library': {
                            'file3.txt': 'file3 content',
                            'file4.txt': 'file4 content',
                            'file5.txt': 'file5 content'
                        }
                    }
                }
            });

            const plugin = new ServerlessPruneNodeModulesPath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });

            plugin.deleteListedFiles(['node_modules/custom_library/file3.txt', 'file1.txt', 'node_modules/file2.txt']);

            expect(fs.existsSync(path.join('/servicePath', 'file1.txt'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/file2.txt'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file3.txt'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file5.txt'))).toBe(true);
        });

        it('should not remove anything when there is no matching path', () => {
            mockFs({
                '/servicePath': {
                    'file1.txt': 'file1 content',
                    'node_modules': {
                        'file2.txt': 'file2 content',
                        'custom_library': {
                            'file3.txt': 'file3 content',
                            'file4.txt': 'file4 content',
                            'file5.txt': 'file5 content'
                        }
                    }
                }
            });

            const plugin = new ServerlessPruneNodeModulesPath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });

            plugin.deleteListedFiles(['node_modules/wrong_path/file3.txt', 'wrong_file1.txt', 'node_modules/wrong_file2.txt']);

            expect(fs.existsSync(path.join('/servicePath', 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file5.txt'))).toBe(true);
        });
    });

    describe('deleteUnlistedFiles', () => {
        it('should keep all the servicePath when no path is given', () => {
            mockFs({
                '/servicePath': {
                    'file1.txt': 'file1 content',
                    'node_modules': {
                        'file2.txt': 'file2 content',
                        'custom_library': {
                            'file3.txt': 'file3 content',
                            'file4.txt': 'file4 content',
                            'file5.txt': 'file5 content'
                        }
                    }
                }
            });

            const plugin = new ServerlessPruneNodeModulesPath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });

            plugin.deleteUnlistedFiles([]);

            expect(fs.existsSync(path.join('/servicePath', 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file5.txt'))).toBe(true);
        });

        it('should keep the specified file and remove all other unlisted files in the same directory of the given path', () => {
            mockFs({
                '/servicePath': {
                    'file1.txt': 'file1 content',
                    'node_modules': {
                        'file2.txt': 'file2 content',
                        'custom_library': {
                            'file3.txt': 'file3 content',
                            'file4.txt': 'file4 content',
                            'file5.txt': 'file5 content'
                        }
                    }
                }
            });

            const plugin = new ServerlessPruneNodeModulesPath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });

            plugin.deleteUnlistedFiles(['node_modules/custom_library/file3.txt']);

            expect(fs.existsSync(path.join('/servicePath', 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file4.txt'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file5.txt'))).toBe(false);
        });

        it('should keep the specified files and remove all other unlisted files in the same directory of the given paths', () => {
            mockFs({
                '/servicePath': {
                    'file1.txt': 'file1 content',
                    'node_modules': {
                        'file2.txt': 'file2 content',
                        'custom_library': {
                            'file3.txt': 'file3 content',
                            'file4.txt': 'file4 content',
                            'file5.txt': 'file5 content'
                        }
                    }
                }
            });

            const plugin = new ServerlessPruneNodeModulesPath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });

            plugin.deleteUnlistedFiles(['node_modules/custom_library/file3.txt', 'node_modules/custom_library/file4.txt']);

            expect(fs.existsSync(path.join('/servicePath', 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file5.txt'))).toBe(false);
        });

        it('should keep the specified directory and remove all other unlisted files and directories in the same directory of the given path', () => {
            mockFs({
                '/servicePath': {
                    'file1.txt': 'file1 content',
                    'node_modules': {
                        'file2.txt': 'file2 content',
                        'custom_library': {
                            'file3.txt': 'file3 content',
                            'file4.txt': 'file4 content',
                            'file5.txt': 'file5 content'
                        },
                        'custom_library2': {
                            'file6.txt': 'file6 content',
                            'file7.txt': 'file7 content',
                            'file8.txt': 'file8 content'
                        }
                    }
                }
            });

            const plugin = new ServerlessPruneNodeModulesPath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });

            plugin.deleteUnlistedFiles(['node_modules/custom_library']);

            expect(fs.existsSync(path.join('/servicePath', 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/file2.txt'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file4.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file5.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library2'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library2/file6.txt'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library2/file7.txt'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library2/file8.txt'))).toBe(false);
        });

        it('should keep the specified file and remove all other unlisted files and directories in the same directory of the given path', () => {
            mockFs({
                '/servicePath': {
                    'file1.txt': 'file1 content',
                    'node_modules': {
                        'file2.txt': 'file2 content',
                        'custom_library': {
                            'file3.txt': 'file3 content',
                            'file4.txt': 'file4 content',
                            'file5.txt': 'file5 content'
                        },
                        'custom_library2': {
                            'file6.txt': 'file6 content',
                            'file7.txt': 'file7 content',
                            'file8.txt': 'file8 content'
                        }
                    }
                }
            });

            const plugin = new ServerlessPruneNodeModulesPath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });

            plugin.deleteUnlistedFiles(['node_modules/file2.txt']);

            expect(fs.existsSync(path.join('/servicePath', 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file3.txt'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file4.txt'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file5.txt'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library2'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library2/file6.txt'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library2/file7.txt'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library2/file8.txt'))).toBe(false);
        });
        it('should keep the specified files and remove all other unlisted files in the same directory of the given path', () => {
            mockFs({
                '/servicePath': {
                    'file1.txt': 'file1 content',
                    'node_modules': {
                        'file2.txt': 'file2 content',
                        'custom_library': {
                            'file3.txt': 'file3 content',
                            'file4.txt': 'file4 content',
                            'file5.txt': 'file5 content'
                        },
                        'custom_library2': {
                            'file6.txt': 'file6 content',
                            'file7.txt': 'file7 content',
                            'file8.txt': 'file8 content'
                        }
                    }
                }
            });

            const plugin = new ServerlessPruneNodeModulesPath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });

            plugin.deleteUnlistedFiles(['node_modules/custom_library/file3.txt', 'node_modules/custom_library2/file6.txt']);

            expect(fs.existsSync(path.join('/servicePath', 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file3.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file4.txt'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library/file5.txt'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library2/file6.txt'))).toBe(true);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library2/file7.txt'))).toBe(false);
            expect(fs.existsSync(path.join('/servicePath', 'node_modules/custom_library2/file8.txt'))).toBe(false);
        });
        it('should throw an error if', () => {
            mockFs({
                '/servicePath': {
                    'file1.txt': 'file1 content',
                    'node_modules': {
                        'file2.txt': 'file2 content',
                        'custom_library': {
                            'file3.txt': 'file3 content',
                            'file4.txt': 'file4 content',
                            'file5.txt': 'file5 content'
                        },
                        'custom_library2': {
                            'file6.txt': 'file6 content',
                            'file7.txt': 'file7 content',
                            'file8.txt': 'file8 content'
                        }
                    }
                }
            });

            const plugin = new ServerlessPruneNodeModulesPath({
                cli: { log: jest.fn() },
                config: { servicePath: '/servicePath' },
            });

            expect(() => {
                plugin.deleteUnlistedFiles(['node_modules/wrong_directory/file3.txt', 'node_modules/custom_library2/wrong_file.txt']);
            }).toThrowError();
        });
    });



});