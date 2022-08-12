import LRUCache from 'lru-cache';
import {cache} from '@jovijovi/pedrojs-common';

export namespace Cache {
	export const CacheSet = cache.New();

	// CacheBalanceObserver balance observer cache, ttl is 3 seconds
	export const CacheBalanceObserver = CacheSet.New("balanceObserver", {
		max: 1000,
		ttl: 1000 * 3,
	});

	// CacheTotalSupplyOfNFT cache of NFT contract total supply, ttl is 3 seconds
	export const CacheTotalSupplyOfNFT = CacheSet.New("totalSupplyOfNFT", {
		max: 1000,
		ttl: 1000 * 3,
	});

	// CacheTotalSupply cache of NFT contract total supply, ttl is 3 seconds
	export const CacheEstimateGasOfTransferNFT = CacheSet.New("estimateGasOfTransferNFT", {
		max: 1000,
		ttl: 1000 * 3,
	});

	// CacheContractOwner cache of NFT contract owner
	export let CacheContractOwner;

	// CachePGPSecretKey cache of PGP secret key, ttl is 1 day
	export const CachePGPSecretKey = CacheSet.New("PGPSecretKey", {
		max: 1,
		ttl: 1000 * 60 * 60 * 24,
		updateAgeOnGet: true,   // Update age(ttl) by 'get'
		updateAgeOnHas: true,   // Update age(ttl) by 'has'
	});

	export function MemCache(name: string, ttl: number = 1000 * 60, max = 10): LRUCache<any, any> {
		return CacheSet.New(name, {
			max: max,   // 10 by default
			ttl: ttl,   // 1 min by default
		});
	}

	// Combination key
	export function CombinationKey(keys: string[]): string {
		return keys.toString();
	}
}
