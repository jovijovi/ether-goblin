# Changelog

## [v0.4.2](https://github.com/jovijovi/ether-goblin/releases/tag/v0.4.2)

Improve:
- refactor(event/transfer): improve performance of getting contract owner

## [v0.4.0](https://github.com/jovijovi/ether-goblin/releases/tag/v0.4.0)

Features:
- feat(event/mint): replace "node-schedule" with "setInterval"
- feat(event/mint): support mysql for NFT archaeologist
- feat(watchdog): replace "node-schedule" with "setInterval"
- feat(watchdog): execute callback if the alert is triggered

Fixes:
- fix(event/mint): remove primary key to support batch minting NFTs in one tx

## [v0.3.7](https://github.com/jovijovi/ether-goblin/releases/tag/v0.3.7)

Features:
- feat(event/transfer): enable contract owner filter by config

## [v0.3.6](https://github.com/jovijovi/ether-goblin/releases/tag/v0.3.6)

Features:
- feat(event/transfer): filters contract address by owner
- feat(event/transfer): use "setInterval" instead of "node-scheduler"

Fixes:
- fix(event/transfer): call contract ABI with provider
- fix(event/transfer): check address in checksum

## [v0.3.4](https://github.com/jovijovi/ether-goblin/releases/tag/v0.3.4)

Features:
- API authorization via 2FA token (optional)

Fixes:
- fix(build): compile sqlite3(napi-v6-linux-musl-x64) in alpine

Build:
- Bump packages

## [v0.2.0](https://github.com/jovijovi/ether-goblin/releases/tag/v0.2.0)

Features:
- Support postgres for NFT archaeologist

## [v0.1.18](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.18)

Features:
- NFT archaeologist, excavating NFT mint events from block history
- Improve callback performance

## [v0.1.15](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.15)

Features:
- Estimate gas of transfer NFT

## [v0.1.14](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.14)

Build:
- Bump packages

## [v0.1.13](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.13)

Features:
- Create JSON wallet
- Retrieve JSON wallet from mnemonic
- Retrieve JSON wallet from pk
- Inspect JSON wallet

Fixes:
- Remove sensitive logs

## [v0.1.12](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.12)

Features:
- Add mint function

Build:
- Set hardhat as default network
- Bump packages

## [v0.1.10](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.10)

Features:
- GoblinToken, a simple ERC20 contract

Fixes:
- Check tx topics in NFT transfer listener

## [v0.1.9](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.9)

Features:
- (event) A NFT transfer event listener
- (eth/api) Set value in response

## [v0.1.7](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.7)

Fixes:
- Add template
- Fix build script

## [v0.1.6](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.6)

Features:
- A simple balance Watchdog

## [v0.1.4](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.4)

Features:
- NFT APIs
- Verify Address API
- New Wallet API

## [v0.1.2](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.2)

Build:
- Bump packages

## [v0.1.1](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.1)

Fixes:
- Build response in JSON style

## [v0.1.0](https://github.com/jovijovi/ether-goblin/releases/tag/v0.1.0)

Features:
- RESTFul APIs for the Ethereum Blockchain and its ecosystem
- Microservice
- Run in docker
- Provider Pool
