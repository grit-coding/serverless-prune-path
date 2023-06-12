const validateConfiguration = require('./configuration');
describe('validateConfiguration()', () => {
    it('should throw error when custom is missing', () => {

        expect(() => validateConfiguration(undefined, {})).toThrow("prunePath configuration is missing from custom");
        expect(() => validateConfiguration(null, {})).toThrow("prunePath configuration is missing from custom");
    });

    it('should throw error when prunePath configuration is missing from custom', () => {
        const custom = {};
        const functions = {};

        expect(() => validateConfiguration(custom, functions)).toThrow("prunePath configuration is missing from custom");
    });

    it('should throw error when invalid keys are present in prunePath', () => {
        const custom = {
            prunePath: {
                invalidKey: [],
                pathsToKeep: []
            }
        };
        const functions = {};

        expect(() => validateConfiguration(custom, functions)).toThrow("Invalid key(s) in prunePath: invalidKey");
    });

    it('should throw error when both pathsToKeep and pathsToDelete are missing in prunePath', () => {
        const custom = {
            prunePath: {}
        };
        const functions = {};
        expect(() => validateConfiguration(custom, functions)).toThrow("At least one of pathsToKeep or pathsToDelete must exist in prunePath");
    });

    it('should throw error when functions are not defined', () => {
        const custom = {
            prunePath: {
                pathsToKeep: { all: ['./node_modules/library/file3.txt'] }
            }
        };
        const functions = {};
        expect(() => validateConfiguration(custom, functions)).toThrow("No functions found in serverless service functions. Please add at least one function in the 'functions' section of your serverless.yml file.");

    });

    it('should throw error when all key is missing', () => {
        const custom = {
            prunePath: {
                pathsToKeep: ['paths'], // Note: all key missing

            }
        };
        const functions = {};
        expect(() => validateConfiguration(custom, functions)).toThrow("pathsToKeep and pathsToDelete must contain the keyword \"all\"");
    });
});