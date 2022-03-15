import LRUCache from 'lru-cache';
import {cache} from '@jovijovi/pedrojs-common';

export namespace Cache {
	const cacheSet = cache.New();

	// CacheBalanceObserver balance observer cache, ttl is 3 seconds
	export const CacheBalanceObserver = cacheSet.New("balanceObserver", {
		max: 1000,
		ttl: 1000 * 3,
	});

	export function MemCache(name: string, ttl: number = 1000 * 60, max = 10): LRUCache<any, any> {
		return cacheSet.New(name, {
			max: max,   // 10 by default
			ttl: ttl,   // 1 min by default
		});
	}
}
