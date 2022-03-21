import {log, util} from '@jovijovi/pedrojs-common';
import {JsonRpcProvider} from '@ethersproject/providers';
import {customConfig} from '../config';

export namespace MyProvider {
	// Provider
	let defaultProvider: JsonRpcProvider;

	// Provider Pool
	const providerPool: JsonRpcProvider[] = [];

	// New provider
	export function New(): JsonRpcProvider {
		const providerSetting = customConfig.GetProvider();
		const chainId = customConfig.GetChainId();
		defaultProvider = new JsonRpcProvider(providerSetting, chainId);

		log.RequestId().info("Network=%s, ChainId=%d, Provider=%s",
			customConfig.GetDefaultNetwork(), chainId, providerSetting);

		return defaultProvider;
	}

	// Get provider
	export function Get(): JsonRpcProvider {
		if (customConfig.GetDefaultNetwork().providerPool) {
			return GetFromPool();
		}

		if (defaultProvider == null) {
			return New();
		}
		return defaultProvider;
	}

	// New provider pool
	export function NewPool() {
		const providerSettings = customConfig.GetAllProviders();
		const chainId = customConfig.GetChainId();
		for (const setting of providerSettings) {
			providerPool.push(new JsonRpcProvider(setting, chainId));
			log.RequestId().info("Init provider pool, Network=%s, ChainId=%d, Provider=%s",
				customConfig.GetDefaultNetwork(), chainId, setting);
		}
	}

	// GetFromPool retrieve a provider from provider pool
	export function GetFromPool(): JsonRpcProvider {
		if (providerPool.length === 0) {
			NewPool();
		}

		// Get random provider, range: [0, providerPool.length)
		const index = util.random.RandIntBetween(0, providerPool.length);

		log.RequestId().trace("Network=%s, ChainId=%d, Provider=%s",
			customConfig.GetDefaultNetwork(), providerPool[index].network.chainId, providerPool[index].connection.url);

		return providerPool[index];
	}
}
