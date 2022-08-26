import fs from 'fs';
import path from 'path';
import writeFileAtomic from 'write-file-atomic';
import {log} from '@jovijovi/pedrojs-common';
import {Cache} from '../../common/cache';
import {customConfig} from '../../config';
import {DefaultCacheTTL, DefaultDumpCacheDir, DefaultDumpCacheFile, DefaultNameOfContractOwnerCache,} from './params';
import {TimeHourInMs} from '../common/constants';

// LoadCacheFromFile load cache from file
export function LoadCacheFromFile(isForceUpdate = false, cacheTTL = DefaultCacheTTL): number {
	const filePath = path.resolve(DefaultDumpCacheDir, DefaultDumpCacheFile);
	if (!fs.existsSync(filePath)) {
		return 0;
	}

	const data = fs.readFileSync(filePath, 'utf8');
	const cache = updateCache(isForceUpdate, data, cacheTTL);
	Cache.CacheContractOwner.load(cache);

	return Cache.CacheContractOwner.size;
}

// updateCache update cache TTL & start timestamp (unit: ms)
function updateCache(isForceUpdate: boolean, data: string, cacheTTL: number): any {
	if (!isForceUpdate) {
		return JSON.parse(data);
	}

	const tm = Date.now();
	return JSON.parse(data, (key, value) => {
		if (key === 'ttl') {
			value = TimeHourInMs * cacheTTL;
		} else if (key === 'start') {
			value = tm;
		}

		return value;
	});
}

// DumpCacheToFile dump cache to file
export async function DumpCacheToFile(): Promise<number> {
	const dirPath = path.resolve(DefaultDumpCacheDir);
	const filePath = path.resolve(dirPath, DefaultDumpCacheFile);

	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, {recursive: true});
	}

	const dmp = Cache.CacheContractOwner.dump();
	await writeFileAtomic(filePath, JSON.stringify(dmp));
	return dmp.length;
}

// GetCacheConfig returns cache config by name
export function GetCacheConfig(name: string): customConfig.CacheOptions {
	if (!customConfig.GetEvents() || !customConfig.GetEvents().listener || !customConfig.GetEvents().listener.cache) {
		throw new Error("Invalid config");
	}

	const cacheList = customConfig.GetEvents().listener.cache;

	try {
		for (let i = 0; i < cacheList.length; i++) {
			if (cacheList[i].name === name) {
				return cacheList[i];
			}
		}
	} catch (e) {
		log.RequestId().error("GetCacheConfig failed, error=", e);
	}

	return undefined;
}

// GetContractOwnerCacheConfig returns contract owner cache config
export function GetContractOwnerCacheConfig(): customConfig.CacheOptions {
	const opts = GetCacheConfig(DefaultNameOfContractOwnerCache);
	if (!opts) {
		throw new Error("Invalid contract owner cache config");
	}
	return opts;
}

// Initialize cache
export function InitCache() {
	const cacheConf = GetContractOwnerCacheConfig();
	const opts = {
		max: cacheConf.max,
		ttl: cacheConf.cacheTTL ? TimeHourInMs * cacheConf.cacheTTL : DefaultCacheTTL,   // Default TTL is 24 hours
		updateAgeOnGet: true,   // Update age(ttl) by 'get'
		updateAgeOnHas: true,   // Update age(ttl) by 'has'
	}
	Cache.CacheContractOwner = Cache.CacheSet.New(DefaultNameOfContractOwnerCache, opts);
}
