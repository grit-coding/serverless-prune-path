const validatePaths = require('./paths');
describe('validatePaths()', () => {
    it('should return contradictory paths when given', () => {
        const pathsToKeep = { all: ['path/to/keep/fileToKeep.txt', 'another/path/to/keep'] };
        const pathsToDelete = { all: ['path/to/keep', 'another/path/to/delete'] };

        const result = validatePaths(pathsToKeep, pathsToDelete);

        expect(result).toEqual(['Keep: "path/to/keep/fileToKeep.txt", Delete: "path/to/keep"']);
    });

    it('should return contradictory paths within pathsToKeep', () => {
        const pathsToKeep = { all: ['path/to/keep/fileToKeep.txt', 'path/to/keep'] };
        const pathsToDelete = undefined;

        const result = validatePaths(pathsToKeep, pathsToDelete);

        expect(result).toEqual(["Keep: \"path/to/keep/fileToKeep.txt\", Keep: \"path/to/keep\""]);
    });

    it('should return empty array when no contradictory paths are given', () => {
        const pathsToKeep = { all: ['path/to/keep/fileToKeep.txt', 'another/path/to/keep'] };
        const pathsToDelete = { all: ['path/to/delete', 'another/path/to/delete'] };

        const result = validatePaths(pathsToKeep, pathsToDelete);

        expect(result).toEqual([]);
    });
});