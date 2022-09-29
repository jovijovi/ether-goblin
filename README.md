# Ether Goblin

[![GitHub Actions](https://github.com/jovijovi/ether-goblin/workflows/Test/badge.svg)](https://github.com/jovijovi/ether-goblin)

A microservice for the Ethereum ecosystem.

## Features

- `APIs` RESTFul APIs for the Ethereum ecosystem
- `Watchdog` A simple balance Watchdog
  - Low/High balance alert (reach limit)
  - Balance change alert
  - Alert mail with PGP
  - Callback
- `Event` ERC721 event
  - `Event Listener` A listener to be triggered for each ERC721 event
  - `Event Fetcher` Fetching ERC721 events from block history
  - Support `Mint`/`Transfer`/`Burn` event
- `Out-of-the-box` NFT APIs (under development)
- API authorization via `2FA` token
- `Microservice` run in Docker

## Supported Chains

- [Ethereum](https://ethereum.org/)
- [Polygon](https://polygon.technology/)
- [zkSync 2.0 (alpha testnet)](https://zksync.io/)

## Development Environment

- typescript `4.8.4`
- node `v16.17.1`
- ts-node `v10.9.1`
- yarn `v1.22.19`

## Contract Dependencies

- @openzeppelin/contracts: [`4.7.3`](https://www.npmjs.com/package/@openzeppelin/contracts/v/4.7.3)

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

- [ ] Documents
- [ ] ERC721(NFT) APIs
- [ ] ERC20 APIs
- [ ] WebSite
- [x] Improve Watchdog performance

## License

[MIT](LICENSE)
