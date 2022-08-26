import {TimeDayInMs} from '../common/constants';

// Default callback job concurrency
export const DefaultCallbackJobConcurrency = 10;

// Default loop interval (unit: ms)
export const DefaultLoopInterval = 3000;

// Default cache TTL
export const DefaultCacheTTL = TimeDayInMs;

// Default dump cache interval (unit: ms)
export const DefaultDumpCacheInterval = 1000 * 60;

// Default name of contract owner cache
export const DefaultNameOfContractOwnerCache = 'contractOwner';

// Default dump cache dir
export const DefaultDumpCacheDir = 'database/cache';

// Default dump cache file
export const DefaultDumpCacheFile = 'contract_owner.json';

// Retry times
export const DefaultRetryTimes = 3;

// Retry interval (second)
export const DefaultRetryInterval = 3;
