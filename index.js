'use strict';
const path = require('path');
const fs = require('fs');

class ServerlessPruneNodeModulesPath {

  constructor(serverless) {
    this.serverless = serverless;
    this.servicePath = this.serverless.config.servicePath;
    this.hooks = {
      'before:package:createDeploymentArtifacts': this.preprocessBeforeDeployment.bind(this)
    };
  }


  preprocessBeforeDeployment() {
    this.serverless.cli.log('Running before createDeploymentArtifacts');

    const customVariables = this.serverless.service.custom.pruneNodeModulesPath;

    // Check for contradictory paths
    if (customVariables.pathsToKeep && customVariables.pathsToDelete) {
      const contradictions = this.findContradictoryPaths(customVariables.pathsToKeep, customVariables.pathsToDelete);
      if (contradictions.length > 0) {
        throw new Error(`Contradictory paths found: ${contradictions.join(', ')}`);
      }
    }

    if (customVariables.pathsToDelete?.length) {
      this.deleteListedFiles(customVariables.pathsToDelete);
    }

    if (customVariables.pathsToKeep?.length) {
      this.deleteUnlistedFiles(customVariables.pathsToKeep);
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




  deleteUnlistedFiles(pathsToKeep) {
    const keepFilesSet = new Set(pathsToKeep.map(filePath => path.join(this.servicePath, filePath)));

    const invalidPath = [...keepFilesSet].find(path => fs.existsSync(path) === false);

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
            fs.rmdirSync(fullPath, { recursive: true });
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




  deleteListedFiles(pathsToDelete) {
    pathsToDelete.forEach((deletePath) => {
      const fullPath = path.join(this.servicePath, deletePath);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        this.serverless.cli.log(`Deleted: ${fullPath}`);
      } else {
        this.serverless.cli.log(`File not found: ${fullPath}`);
      }
    });
  }
}

module.exports = ServerlessPruneNodeModulesPath;
