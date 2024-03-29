# Changelog

## [v0.12.0](https://github.com/jovijovi/ether-goblin/releases/tag/v0.12.0)

### Features

- (module/event/fetcher): fetch events by contract address

### Build

- Bump node version from 16.18 to 18.12
- Bump typescript from 4.8.4 to 4.9.3
- Bump @openzeppelin/contracts from 4.7.3 to 4.8.0
- Bump packages

## [v0.11.6](https://github.com/jovijovi/ether-goblin/releases/tag/v0.11.6)

### Fixes

- (module/event/fetcher): push event to callback queue

### Build

- Replaced node-slim with node-alpine because the bug was fixed in hardhat@2.12.1. Ref: <https://github.com/NomicFoundation/hardhat/issues/3195>
- Bump node version from 16.17 to 16.18
- Bump packages

## [v0.11.2](https://github.com/jovijovi/ether-goblin/releases/tag/v0.11.2)

### Features

- (module/event/fetcher/db): add `BulkSave`

### Performance

- (module/event/fetcher): improve dump events performance by `BulkSave`

### Refactor

- (module/event/fetcher): refactor callback

### Build

- Bump packages

## [v0.11.0](https://github.com/jovijovi/ether-goblin/releases/tag/v0.11.0)

### BREAKING CHANGES

- (module/event/fetcher/db):
  - Rename database fields in underlined style
  - Add new fields: 'block_timestamp', 'block_datetime' and 'event_type'

### Features

- Load module by [@jovijovi/pedrojs-loader](https://www.npmjs.com/package/@jovijovi/pedrojs-loader)
- (module/event/fetcher):
  - Display a progress bar by config
  - Register HTTP APIs by config
  - Force update database if the data already exists
  - Add API 'GetTokenHistory'

### Performance

- (module/event/fetcher): improve query logs performance

### Build

- Bump packages

## [v0.10.1](https://github.com/jovijovi/ether-goblin/releases/tag/v0.10.1)

### Features

- Load modules and register HTTP APIs through the module loader
- (module/event/fetcher): add progress bar of event fetcher
- (module/event/fetcher): init fetcher with config

### Refactor

- Import the package [@jovijovi/ether-core-api](https://www.npmjs.com/package/@jovijovi/ether-core-api)

### Build

- Bump packages

## [v0.9.1](https://github.com/jovijovi/ether-goblin/releases/tag/v0.9.1)

### Fixes

- (watchdog): error response in init()

### Build

- Replace node-alpine with node-slim. Ref: <https://github.com/NomicFoundation/hardhat/issues/3195>

## [v0.9.0](https://github.com/jovijovi/ether-goblin/releases/tag/v0.9.0)

### Features

- (watchdog): initialize watchdog with block time from config
- (watchdog): send alert mails by queue
- (watchdog): try to catch up the latest block
- (watchdog): modify template wording

### Refactor

- (watchdog): init watchdog with config
- (watchdog): alert mail
- (watchdog): alert generator
- (watchdog): get balance
- (watchdog): listen block event

### Fixes

- Use strict equality operators
- (watchdog): export `MailContent` interface
- (watchdog): remove magic number

### Performance

- (watchdog): improve the performance of checking balances

### Test

- (devenv): mount keystore volume
- (devenv): bump postgres from 13.6 to 13.8

### Build

- Bump packages

## [v0.8.5](https://github.com/jovijovi/ether-goblin/releases/tag/v0.8.5)

### Features

- (event/listener): support contract proxy

## [v0.8.4](https://github.com/jovijovi/ether-goblin/releases/tag/v0.8.4)

### Features

- (event/listener): when loading the cache, set the cache TTL to the latest config and set the start timestamp to the
  current time
- (event/listener): retry to get contract owner with random interval

### Build

- Bump packages

## [v0.8.3](https://github.com/jovijovi/ether-goblin/releases/tag/v0.8.3)

### Refactor

- (event/listener): init cache

### Build

- Bump node version
- Bump packages

## [v0.8.0](https://github.com/jovijovi/ether-goblin/releases/tag/v0.8.0)

### Features

- (watchdog): balance changes alert

### Build

- Bump packages

## [v0.7.0](https://github.com/jovijovi/ether-goblin/releases/tag/v0.7.0)

### Features

- (event/fetcher): API to push fetch events job to scheduler
- (event/fetcher): callback for fetching event

### Fixes

- (event/fetcher/db): create composite primary key

## [v0.6.0](https://github.com/jovijovi/ether-goblin/releases/tag/v0.6.0)

### Features

- (event): listener and fetcher support mint/transfer/burn events
- (event/transfer): custom cache options by config file
- (event/fetcher): retry getLogs
- (event/fetcher): custom fromBlock
- (event/fetcher/db): custom uri and table name
- (mailer): support PGP
- (mailer/template): add more details

### Fixes

- (event/transfer): returns 0 if no dump file was found when loading the cache

## [v0.5.0](https://github.com/jovijovi/ether-goblin/releases/tag/v0.5.0)

### Features

- (event/transfer): load/dump cache of contract owner

### Refactor

- (event/transfer): checkContract

### Build

- Bump packages

## [v0.4.2](https://github.com/jovijovi/ether-goblin/releases/tag/v0.4.2)

### Refactor

- (event/transfer): improve performance of getting contract owner

## [v0.4.0](https://github.com/jovijovi/ether-goblin/releases/tag/v0.4.0)

### Features

- (event/mint): replace "node-schedule" with "setInterval"
- (event/mint): support mysql for NFT archaeologist
- (watchdog): replace "node-schedule" with "setInterval"
- (watchdog): execute callback if the alert is triggered

### Fixes

- (event/mint): remove primary key to support batch minting NFTs in one tx

## [v0.3.7](https://github.com/jovijovi/ether-goblin/releases/tag/v0.3.7)

### Features

- (event/transfer): enable contract owner filter by config

## [v0.3.6](https://github.com/jovijovi/ether-goblin/releases/tag/v0.3.6)

### Features

- (event/transfer): filters contract address by owner
- (event/transfer): use "setInterval" instead of "node-scheduler"

### Fixes

- (event/transfer): call contract ABI with provider
- (event/transfer): check address in checksum

## [v0.3.4](https://github.com/jovijovi/ether-goblin/releases/tag/v0.3.4)

### Features

- API authorization via 2FA token (optional)

### Fixes

- (build): compile sqlite3(napi-v6-linux-musl-x64) in alpine

### Build

- Bump packages

## [v0.2.0](https://github.com/jovijovi/ether-goblin/releases/tag/v0.2.0)

### Features

- Support postgres for NFT archaeologist

## [v0.1.18](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.18)

### Features

- NFT archaeologist, excavating NFT mint events from block history
- Improve callback performance

## [v0.1.15](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.15)

### Features

- Estimate gas of transfer NFT

## [v0.1.14](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.14)

### Build

- Bump packages

## [v0.1.13](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.13)

### Features

- Create JSON wallet
- Retrieve JSON wallet from mnemonic
- Retrieve JSON wallet from pk
- Inspect JSON wallet

### Fixes

- Remove sensitive logs

## [v0.1.12](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.12)

### Features

- Add mint function

### Build

- Set hardhat as default network
- Bump packages

## [v0.1.10](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.10)

### Features

- GoblinToken, a simple ERC20 contract

### Fixes

- Check tx topics in NFT transfer listener

## [v0.1.9](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.9)

### Features

- (event): A NFT transfer event listener
- (eth/api): Set value in response

## [v0.1.7](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.7)

### Fixes

- Add template
- Fix build script

## [v0.1.6](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.6)

### Features

- A simple balance Watchdog

## [v0.1.4](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.4)

### Features

- NFT APIs
- Verify Address API
- New Wallet API

## [v0.1.2](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.2)

### Build

- Bump packages

## [v0.1.1](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.1)

### Fixes

- Build response in JSON style

## [v0.1.0](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.0)

### Features

- RESTFul APIs for the Ethereum Blockchain and its ecosystem
- Microservice
- Run in docker
- Provider Pool
