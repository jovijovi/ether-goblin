# Ether Goblin

[![GitHub Actions](https://github.com/jovijovi/ether-goblin/workflows/Test/badge.svg)](https://github.com/jovijovi/ether-goblin)

A microservice for the Ethereum ecosystem.

## Features

- RESTFul APIs for the Ethereum ecosystem
- A simple balance Watchdog
- NFT transfer tx listener
- NFT archaeologist, excavating NFT mint events from block history
- More out-of-the-box NFT APIs (under development)
- API authorization via 2FA token
- Microservice run in Docker

## Supported Chains

- [Ethereum](https://ethereum.org/)
- [Polygon](https://polygon.technology/)
- [zkSync 2.0 (alpha testnet)](https://zksync.io/)

## Development Environment

- typescript `4.7.4`
- node `v16.16.0`
- ts-node `v10.9.1`
- yarn `v1.22.19`

## Contract Dependencies

- @openzeppelin/contracts: [`4.7.2`](https://www.npmjs.com/package/@openzeppelin/contracts/v/4.7.2)

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
- NFT APIs
- ERC20 APIs

## License

[MIT](LICENSE)
