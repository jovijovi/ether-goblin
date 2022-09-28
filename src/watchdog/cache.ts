// Balance cache
import {BigNumber} from 'ethers';
import {Queue} from '@jovijovi/pedrojs-common/util';
import {BalanceCache} from './types';
import {DefaultBalanceCacheMaxLimit} from './params';

// Cache of address balance
export const CacheAddressBalance: BalanceCache<any> = {};

// Set cache
export function SetCache(address: string, rule: string, balance: BigNumber) {
	const key = combinationCacheKey([address, rule]);
	if (!CacheAddressBalance[key]) {
		CacheAddressBalance[key] = new Queue(DefaultBalanceCacheMaxLimit);
	}

	CacheAddressBalance[key].Push(balance);
}

// Get past balance from cache
export function GetPastBalance(address: string, rule: string): BigNumber {
	const key = combinationCacheKey([address, rule]);
	if (!CacheAddressBalance[key]) {
		CacheAddressBalance[key] = new Queue(DefaultBalanceCacheMaxLimit);
	}

	return CacheAddressBalance[key].First();
}

// Combination cache key
function combinationCacheKey(keys: string[]): string {
	return keys.toString();
}
