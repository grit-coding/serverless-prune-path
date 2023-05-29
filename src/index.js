'use strict';
const path = require('path');
const fs = require('fs');
const unzipper = require('unzipper');
const archiver = require('archiver');

class ServerlessPrunePath {

  constructor(serverless) {
    this.serverless = serverless;
    this.servicePath = path.join(this.serverless.config.servicePath, '.serverless');
    this.hooks = {
      'after:package:finalize': this.afterPackageFinalize.bind(this)
    };
  }

  validateCustomVariables(custom) {
    // Check if prunePath exists
    if (!custom || !custom.prunePath) {
      throw new Error("prunePath configuration is missing from custom");
    }

    // Check for invalid keys
    const validKeys = ["pathsToKeep", "pathsToDelete"];
    const prunePathKeys = Object.keys(custom.prunePath);
    const invalidKeys = prunePathKeys.filter(key => !validKeys.includes(key));

    if (invalidKeys.length > 0) {
      throw new Error(`Invalid key(s) in prunePath: ${invalidKeys.join(", ")}`);
    }

    // Check if at least one of pathsToKeep or pathsToDelete exists
    if (!custom.prunePath.pathsToKeep && !custom.prunePath.pathsToDelete) {
      throw new Error("At least one of pathsToKeep or pathsToDelete must exist in prunePath");
    }
  }




  async afterPackageFinalize() {
    this.serverless.cli.log('Running afterPackageFinalize');

    this.validateCustomVariables(this.serverless.service.custom);

    const customVariables = this.serverless.service.custom.prunePath;

    if (customVariables.pathsToKeep && customVariables.pathsToDelete) {

      const contradictions = this.findContradictoryPaths(customVariables.pathsToKeep, customVariables.pathsToDelete);
      if (contradictions.length > 0) {
        throw new Error(`Contradictory paths found: ${contradictions.join(', ')}`);
      }
    }

    const slsPackages = fs.readdirSync(this.servicePath).filter(file => file.endsWith('.zip'));
    for (const singlePackage of slsPackages) {
      const packagePath = path.join(this.servicePath, singlePackage);
      const unzipDir = path.join(this.servicePath, path.basename(singlePackage, '.zip'));

      // Unzip the package to a specific directory.
      const directory = await unzipper.Open.file(packagePath);
      await directory.extract({ path: unzipDir });

      // Delete the zipped package.
      fs.unlinkSync(packagePath);

      // Prune the files.
      if (customVariables.pathsToDelete?.length) {
        this.deleteListedFiles(customVariables.pathsToDelete, unzipDir);
      }

      if (customVariables.pathsToKeep?.length) {
        this.deleteUnlistedFiles(customVariables.pathsToKeep, unzipDir);
      }

      // Re-zip the package.
      const output = fs.createWriteStream(packagePath);
      const archive = archiver('zip');

      archive.pipe(output);
      archive.directory(unzipDir, false);
      await archive.finalize();

      // Delete the unzipped directory.
      fs.rmSync(unzipDir, { recursive: true });
    }

  }



  findContradictoryPaths(pathsToKeep, pathsToDelete) {
    const contradictions = [];
    for (const keepPath of pathsToKeep) {
      for (const deletePath of pathsToDelete) {
        if (keepPath.startsWith(deletePath)) {
          contradictions.push(`Keep: "${keepPath}", Delete: "${deletePath}"`);
        }
      }
    }
    return contradictions;
  }




  deleteUnlistedFiles(pathsToKeep, unzipDir) {
    const keepFilesSet = new Set(pathsToKeep.map(filePath => path.join(unzipDir, filePath)));

    const invalidPath = [...keepFilesSet].find(path => {
      const fileExist = fs.existsSync(path) === false;
      if (fileExist) {
        const realPath = fs.realpathSync(path);
        if (realPath !== path) {
          this.serverless.cli.log(`Case does not match for: ${path}. Real path: ${realPath}`);
          return true;
        }
      }
      return false;
    });

    if (invalidPath?.length) {
      throw new Error(`File not found: ${invalidPath}`);
    }

    // check if all pathsToKeep values existing path. if not throw an error.
    let targetDirectoriesToPrune = [...keepFilesSet].map(file => path.dirname(file));

    // Remove duplicate directories and sort them so that directories near the root come first.
    targetDirectoriesToPrune = [...new Set(targetDirectoriesToPrune)].sort((a, b) => {
      const aDepth = a.split(path.sep).length;
      const bDepth = b.split(path.sep).length;
      return aDepth - bDepth;
    });

    targetDirectoriesToPrune.forEach(dir => {
      fs.readdirSync(dir, { withFileTypes: true }).forEach(file => {
        const fullPath = path.join(dir, file.name);

        if (!keepFilesSet.has(fullPath)) {
          if (file.isDirectory()) {
            // Recursively delete directory if it's not in the keep list.
            fs.rmSync(fullPath, { recursive: true });
            this.serverless.cli.log(`Deleted directory: ${fullPath}`);
          } else {
            // Delete file if it's not in the keep list.
            fs.unlinkSync(fullPath);
            this.serverless.cli.log(`Deleted file: ${fullPath}`);
          }
        }
      });
    });
  }




  deleteListedFiles(pathsToDelete, unzipDir) {
    pathsToDelete.forEach((deletePath) => {
      const fullPath = path.join(unzipDir, deletePath);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        this.serverless.cli.log(`Deleted: ${fullPath}`);
      } else {
        this.serverless.cli.log(`File not found: ${fullPath}`);
      }
    });
  }
}

module.exports = ServerlessPrunePath;
