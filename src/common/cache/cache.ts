import LRUCache from 'lru-cache';
import {cache} from '@jovijovi/pedrojs-common';

export namespace Cache {
	const cacheSet = cache.New();

	// CacheBalanceObserver balance observer cache, ttl is 3 seconds
	export const CacheBalanceObserver = cacheSet.New("balanceObserver", {
		max: 1000,
		ttl: 1000 * 3,
	});

	// CacheTotalSupplyOfNFT cache of NFT contract total supply, ttl is 3 seconds
	export const CacheTotalSupplyOfNFT = cacheSet.New("totalSupplyOfNFT", {
		max: 1000,
		ttl: 1000 * 3,
	});

	// CacheTotalSupply cache of NFT contract total supply, ttl is 3 seconds
	export const CacheEstimateGasOfTransferNFT = cacheSet.New("estimateGasOfTransferNFT", {
		max: 1000,
		ttl: 1000 * 3,
	});

	// CacheContractOwner cache of NFT contract owner, ttl is 24 hours
	export const CacheContractOwner = cacheSet.New("contractOwner", {
		max: 20000,
		ttl: 1000 * 60 * 60 * 24,   // TTL is 24 hours
		updateAgeOnGet: true,       // Update age(ttl) by 'get'
		updateAgeOnHas: true,       // Update age(ttl) by 'has'
	});

	export function MemCache(name: string, ttl: number = 1000 * 60, max = 10): LRUCache<any, any> {
		return cacheSet.New(name, {
			max: max,   // 10 by default
			ttl: ttl,   // 1 min by default
		});
	}

	// Combination key
	export function CombinationKey(keys: string[]): string {
		return keys.toString();
	}
}
