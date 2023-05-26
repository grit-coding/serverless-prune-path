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
      pathsToKeep:
        - '.package-lock.json'
      pathsToDelete:
        - './node_modules/luxon/license.md'
     */
    const customVariables = this.serverless.service.custom.pruneNodeModulesPath;


    if (customVariables.pathsToDelete?.length) {
      this.deleteListedFiles(customVariables.pathsToDelete);
    }

    if (customVariables.pathsToKeep?.length) {
      this.deleteUnlistedFiles(customVariables.pathsToKeep);
    }

  }


  deleteUnlistedFiles(pathsToKeep) {
    // Convert file paths to keep into a set for faster lookup
    const keepFilesSet = new Set(pathsToKeep.map(filePath => path.join(this.servicePath, filePath)));

    // Get unique directories from the keepFilesSet
    const directories = [...keepFilesSet].map(file => path.dirname(file)).filter((value, index, array) => array.indexOf(value) === index);

    // Recursive function to go through directories
    const processDirectory = dir => {
      fs.readdirSync(dir, { withFileTypes: true }).forEach(file => {
        const fullPath = path.join(dir, file.name);


        if (file.isDirectory()) {
          // If it's a directory and in the keep list, recurse into it
          if (directories.includes(fullPath)) {
            processDirectory(fullPath);
          }
        } else {
          // If it's a file and it's not in the keep list, delete it
          if (!keepFilesSet.has(fullPath)) {
            fs.unlinkSync(fullPath);
            this.serverless.cli.log(`Deleted: ${fullPath}`);
          }
        }
      });
    };

    // Start processing from each directory in the keep list
    directories.forEach(dir => processDirectory(dir));
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
