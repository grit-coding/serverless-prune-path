
# Serverless Prune Path
[![Coverage Status](https://coveralls.io/repos/github/grit-coding/serverless-prune-path/badge.svg?branch=main)](https://coveralls.io/github/grit-coding/serverless-prune-path?branch=main)
</br>

This Serverless plugin allows you to optimize your AWS Lambda package before deployment by providing the ability to selectively prune your package. You can either specify paths to keep or paths to delete within the given directory.

The plugin works by first unpacking the Lambda package, pruning paths according to your specification, and then repackaging. This gives you greater control over your deployment package, especially when you are using custom packages or other packaging plugins.

This can be particularly useful when your project has dependencies or files that are not needed in the production environment, allowing you to reduce the size of your deployment package and ultimately the cold start time of your Lambda functions.
</br>

## Prerequisites
Before using the serverless-prune-path plugin, make sure you have an existing Serverless project set up and Serverless Framework installed.

If you don't have the Serverless Framework installed, you can do so by running:

```bash
Copy code
npm install -g serverless
```
For more details on setting up a Serverless project and installing the Serverless Framework, please refer to the [Serverless Framework Getting Started Guide](https://www.serverless.com/framework/docs/tutorial).
</br>

## How to Use

### Installation

Install the plugin via npm:
```bash
npm install --save-dev serverless-prune-path
```
</br>


### Configuration

In your serverless.yml, add the plugin and configure your prunePath settings in the custom field:

```yaml
plugins:
  - serverless-prune-path

custom:
  prunePath:
    pathsToKeep:
      all:
        - 'path/to/keep/1'
        - 'path/to/keep/2'
    pathsToDelete:
      all:
        - 'path/to/delete/1'
        - 'path/to/delete/2'
```

The `pathsToKeep` and `pathsToDelete` configuration options accept an object with a special keyword `all`. When you use 'all' as a key, it means that the array of paths you specify will apply to every single function in your service.

In this version, only the 'all' configuration is available for specifying the scope of pruning. That is, all the Lambda functions are targeted for pruning with the specified paths. Pruning individual functions is a feature planned for a future release.
</br>

### Example

```yaml
custom:
  prunePath:
    pathsToKeep:
      all:
        - 'node_modules'
        - 'handler.js'
```

In this example, 'node_modules' and 'handler.js' will be the only paths kept in every function's package. All other files and directories will be removed from the packages.
</br>

Likewise, if 'all' is used under `pathsToDelete`, the specified paths will be deleted from all function packages.

```yaml
custom:
  prunePath:
    pathsToDelete:
      all:
        - 'node_modules/aws-sdk'
```

In this example, 'node_modules/aws-sdk' will be deleted from every function's package.

Please note: Incorrect configuration may lead to the deletion of necessary files, causing your Lambda function to fail.
</br>

### Prune Test

If you want to check the result of prune path, run the below command and check the packed lambda.
```bash
serverless package
```
If you are happy with the result, and want to deploy 
```bash
serverless deploy
```
</br>

## Future Work

We're always working to improve Serverless Prune Path and have some exciting features planned for the next version:

* Individual Function Pruning: We plan to introduce a feature to allow pruning paths for individual functions, giving you even greater control over your lambda packages.

</br>

## README in Other Languages

* [한국어](https://github.com/grit-coding/serverless-prune-path/blob/main/docs/README-ko.md)