'use strict';
const path = require('path');
const fs = require('fs');
const unzipper = require('unzipper');
const archiver = require('archiver');
const validatePaths = require('./validators/paths');
const validateConfiguration = require('./validators/configuration');
const processPathsToDelete = require('./prune-path-ops/paths-to-delete');
const processPathsToKeep = require('./prune-path-ops/paths-to-keep');

class ServerlessPrunePath {

  constructor(serverless) {
    this.serverless = serverless;
    this.servicePath = path.join(this.serverless.config.servicePath, '.serverless');
    this.hooks = {
      'after:package:finalize': this.afterPackageFinalize.bind(this)
    };
  }

  async afterPackageFinalize() {
    this.serverless.cli.log('Serverless-prune-path plugin is running: after package finalization stage.');

    validateConfiguration(this.serverless.service.custom, this.serverless.service.functions);

    const customVariables = this.serverless.service.custom.prunePath;

    const contradictions = validatePaths(customVariables.pathsToKeep, customVariables.pathsToDelete);
    if (contradictions.length > 0) {
      throw new Error(`Contradictory paths found: ${contradictions.join(', ')}`);
    }


    //both all
    const slsPackages = fs.readdirSync(this.servicePath).filter(file => file.endsWith('.zip'));

    for (const singlePackage of slsPackages) {

      const packagePath = path.join(this.servicePath, singlePackage);
      const unzipDir = path.join(this.servicePath, path.basename(singlePackage, '.zip'));

      const directory = await unzipper.Open.file(packagePath);
      await directory.extract({ path: unzipDir });

      // Delete the zipped package.
      fs.unlinkSync(packagePath);

      // Prune the files.
      if (customVariables.pathsToDelete?.all?.length) {
        processPathsToDelete(customVariables.pathsToDelete.all, unzipDir, this.serverless);
      }

      if (customVariables.pathsToKeep?.all?.length) {
        processPathsToKeep(customVariables.pathsToKeep.all, unzipDir, this.serverless);
      }

      // Re-zip the package.
      const output = fs.createWriteStream(packagePath);
      const archive = archiver('zip');

      archive.pipe(output);
      archive.directory(unzipDir, false);
      archive.finalize();

      // Use a promise to listen for the close event.
      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);  // You might want to handle errors too.
      });

      // Delete the unzipped directory.
      fs.rmSync(unzipDir, { recursive: true });
    }
  }
}

module.exports = ServerlessPrunePath;
