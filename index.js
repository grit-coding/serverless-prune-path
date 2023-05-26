'use strict';
const path = require('path');
const fs = require('fs');

class ServerlessPruneNodeModulesPath {

  constructor(serverless) {
    this.serverless = serverless;
    this.servicePath = this.serverless.config.servicePath;
    this.hooks = {
      'before:package:createDeploymentArtifacts': this.test.bind(this)
    };
  }


  test() {
    this.serverless.cli.log('Running before createDeploymentArtifacts');

    /**
    pruneNodeModulesPath:
      keepPath:
        - '.package-lock.json'
      deletePath:
        - './node_modules/luxon/license.md'
     */
    const customVariables = this.serverless.service.custom.pruneNodeModulesPath;
    //check if keepPath and deletePath is contradictory


    if (customVariables.deletePath) {
      this.deletePaths(customVariables.deletePath);
    }

    if (customVariables.keepPath) {
      this.deleteOtherFilesWithoutGivenPath(customVariables.keepPath);
    }

  }

  deletePaths(pathsToDelete) {
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
