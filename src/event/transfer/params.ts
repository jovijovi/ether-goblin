// Default callback job concurrency
export const DefaultCallbackJobConcurrency = 10;

// Default loop interval (unit: ms)
export const DefaultLoopInterval = 3000;

// Default dump cache interval (unit: ms)
export const DefaultDumpCacheInterval = 1000 * 60;

// Default name of contract owner cache
export const DefaultNameOfContractOwnerCache = 'contractOwner';

// Default dump cache dir
export const DefaultDumpCacheDir = 'database/cache';

// Default dump cache file
export const DefaultDumpCacheFile = 'contract_owner.json';

// ERC721 Transfer event name
export const EventNameTransfer = 'Transfer(address,address,uint256)';

export const EventTypeMint = 'mint';
// const EventTypeTransfer = 'transfer';
export const EventTypeBurn = 'burn';

// Retry times
export const DefaultRetryTimes = 3;

// Retry interval (second)
export const DefaultRetryInterval = 3;

// Time unit in millisecond
// Day/Hour/Minute/Second
export const TimeDayInMs = 1000 * 60 * 60 * 24;
export const TimeHourInMs = 1000 * 60 * 60;
export const TimeMinuteInMs = 1000 * 60;
export const TimeSecondInMs = 1000;
