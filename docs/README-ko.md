# Serverless Prune Path
[![Coverage Status](https://coveralls.io/repos/github/grit-coding/serverless-prune-path/badge.svg?branch=main)](https://coveralls.io/github/grit-coding/serverless-prune-path?branch=main)
</br>

Serverless Prune Path 플러그인은 패키지를 선택적으로 정리하여 AWS Lambda 패키지를 배포 전에 최적화할 수 있도록 도와줍니다. 주어진 디렉토리 내에서 유지할 경로나 삭제할 경로를 지정할 수 있습니다.

플러그인 작동 시 먼저 압축된 Lambda 패키지를 풀고, 지정된 경로를 정리한 후, 다시 패키지를 압축합니다. 이런 방식을 통해 커스텀 패키지나 다른 패키징 플러그인을 사용시 배포할 패키지에 대한 통제력을 가질 수 있습니다.

이는 프로젝트에 프로덕션 환경에서 필요하지 않은 의존성이나 파일이 있는 경우에 특히 유용하여, 배포 패키지의 크기를 줄이고 결국에는 Lambda 함수의 Cold Start 시간을 줄일 수 있습니다.
</br>

## 사전 준비 사항
serverless-prune-path 플러그인을 사용하기 전에 Serverless 프로젝트가 이미 설정되어 있고 Serverless Framework가 설치되어 있는지 확인하세요.

Serverless Framework가 설치되어 있지 않다면, 아래의 명령어로 설치할 수 있습니다:

```bash
npm install -g serverless
```

자세한 설치 및 설정 방법은 [Serverless Framework 시작하기](https://www.serverless.com/framework/docs/tutorial)를 참조하세요.
</br>

## 사용 방법

### 설치

npm을 통해 플러그인을 설치하세요:
```bash
npm install --save-dev serverless-prune-path
```
</br>

### 설정

serverless.yml 파일에서 플러그인을 추가하고 custom 필드에 prunePath를 설정해주세요:

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

`pathsToKeep` 및 `pathsToDelete` 설정 옵션은 `all`이라는 특별한 키워드를 포함하는 객체를 받습니다. 'all'이라는 키를 사용하면, 지정한 경로 배열이 서비스 내의 모든 함수에 적용됩니다.

이 버전에서는 정리 범위를 지정하는 것이 'all' 설정만 가능합니다. 즉, 지정된 경로로 모든 Lambda 함수가 정리 대상입니다. 개별 함수를

 정리하는 기능은 향후 릴리스에 계획되어 있습니다.
</br>

### 예시

```yaml
custom:
  prunePath:
    pathsToKeep:
      all:
        - 'node_modules'
        - 'handler.js'
```

이 예시에서, 'node_modules'와 'handler.js'는 모든 람다 패키지에서 유지될 유일한 경로가 됩니다. 패키지에서 다른 모든 파일 및 디렉토리는 제거됩니다.
</br>

마찬가지로, `pathsToDelete` 아래에서 'all'을 사용하면, 지정된 경로가 모든 람다 패키지에서 삭제됩니다.

```yaml
custom:
  prunePath:
    pathsToDelete:
      all:
        - 'node_modules/aws-sdk'
```

이 예시에서, 'node_modules/aws-sdk'는 모든 람다 패키지에서 삭제됩니다.

주의: 잘못된 설정으로 인해 필요한 파일이 삭제될 수 있으며, 이로 인해 Lambda 함수가 실패할 수 있습니다.
</br>

### Prune 테스트

prune path의 결과를 확인하려면 아래의 명령어를 실행하고 packed lambda를 확인하세요.
```bash
serverless package
```
결과에 만족하고 배포하고 싶다면 다음 명령어를 입력하세요.
```bash
serverless deploy
```
</br>

## 향후 작업

Serverless Prune Path를 개선하려고 노력하고 있으며, 다음 버전에는 다음과 같은 계획하고 있습니다:

* 개별 람다 함수 정리: 개별 람다 패키지 내에 경로를 정리할 수 있는 기능을 도입할 계획이며, 이를 통해 람다 패키지에 대한 더 큰 통제력을 가질 수 있습니다.
