# Ether Goblin

A microservice for calling ethereum APIs.

## Features

- RESTFul APIs for ethereum
- Microservice
- Run in docker

## Development Environment

- typescript `4.6.2`
- node `v16.14.0`
- ts-node `v10.7.0`
- yarn `v1.22.17`

## Quick Guide

- Install dependency

  ```shell
  yarn
  ```

- Build code

  Install all dependencies and compile code.

  ```shell
  make build
  ```

- Build docker image

  ```shell
  make docker
  ```

- Run

  - Params

    - `--config` Config filepath. Example:

      ```shell
      ts-node ./src/main/index.ts --config ./conf/app.config.yaml
      ```

  - Run code directly by `ts-node`

    ```shell
    yarn dev-run --config ./conf/app.config.yaml
    ```

  - Run compiled code by `node`

    ```shell
    yarn dist-run --config ./conf/app.config.yaml
    ```

- Clean

  ```shell
  make clean
  ```

## Roadmap

- Documents

## License

[MIT](LICENSE)
