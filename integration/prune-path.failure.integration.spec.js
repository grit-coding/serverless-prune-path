const ServerlessPrunePath = require('../src/index');

describe('ServerlessPrunePath plugin - Failing scenarios', () => {
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

