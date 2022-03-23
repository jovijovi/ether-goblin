import {config} from '@jovijovi/pedrojs-common';

export namespace customConfig {
	/***************
    # Ethereum Config Example
    ethereum:
      mainnet:
        # Chain ID
        chainId: 1
        # Provider URL
        provider: https://http-mainnet.chain.pixie.xyz
        # Blockchain explorer URL
        browser: https://etherscan.io
	 ****************/

	class Network {
		chainId: number
		provider: string[]
		browser?: string
	}

	type Chain = Map<string, Map<string, Network>>;

	class DefaultNetwork {
		chain: string
		network: string
		providerPool?: boolean
	}

	class TxConfig {
		gasLimitC: number
		confirmations: number
	}

	export class Mailer {
		smtp: string
		port: number
		secure: boolean
		user: string
		password: string
		sender: string
		receivers: string[]
	}

	export class WatchedAddress {
		address: string
		rule: string
		limit: string   // limit unit is Wei
	}

	class Watchdog {
		enable: boolean
		mailer: Mailer
		period: number
		addressList: WatchedAddress[]
	}

	export class CustomConfig {
		defaultNetwork: DefaultNetwork
		tx: TxConfig
		networks: Chain
		watchdog?: Watchdog
	}

	let customConfig: CustomConfig;

	export function LoadCustomConfig() {
		customConfig = config.GetYmlConfig().custom;
	}

	// GetDefaultNetwork returns default chain & network name
	export function GetDefaultNetwork(): DefaultNetwork {
		return customConfig.defaultNetwork;
	}

	// GetTxConfig returns tx config
	export function GetTxConfig(): TxConfig {
		return customConfig.tx;
	}

	// GetNetwork returns network config
	export function GetNetworkConfig(defaultNetwork: DefaultNetwork): Network {
		const network = customConfig.networks[defaultNetwork.chain][defaultNetwork.network]
		if (!network) {
			throw new Error(`GetNetwork Failed, Unknown Network: ${defaultNetwork}`);
		}
		return network;
	}

	// GetProvider returns 1st provider
	export function GetProvider(): string {
		const provider = GetNetworkConfig(GetDefaultNetwork()).provider;
		if (!provider || provider.length == 0 || !provider[0]) {
			throw new Error('GetProvider failed, invalid provider');
		}
		return provider[0];
	}

	// GetAllProviders returns all providers
	export function GetAllProviders(): string[] {
		const provider = GetNetworkConfig(GetDefaultNetwork()).provider;
		if (!provider || provider.length == 0) {
			throw new Error('GetAllProviders failed, invalid provider');
		}
		return provider;
	}

	// GetChainId returns chain id
	export function GetChainId(): number {
		const chainId = GetNetworkConfig(GetDefaultNetwork()).chainId;
		if (!chainId) {
			throw new Error('GetChainId failed, invalid chainId');
		}
		return chainId;
	}

	// GetBrowser returns blockchain browser URL
	export function GetBrowser(): string {
		return GetNetworkConfig(GetDefaultNetwork()).browser;
	}

	// GetWatchdog returns watchdog config
	export function GetWatchdog(): Watchdog {
		if (customConfig.watchdog) {
			return customConfig.watchdog;
		}

		throw new Error(`GetWatchdog Failed, invalid config`);
	}
}
