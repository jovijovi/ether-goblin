import {Block} from '@ethersproject/abstract-provider';
import {network} from '@jovijovi/ether-network';
import {log, util} from '@jovijovi/pedrojs-common';
import {DefaultRetryMaxInterval, DefaultRetryMinInterval, DefaultRetryTimes} from './params';
import {Cache} from '../../../common/cache';

// GetBlockNumber returns block number
export async function GetBlockNumber(): Promise<number> {
	const provider = network.MyProvider.Get();
	const blockNumber = await util.retry.Run(async (): Promise<number> => {
		return await provider.getBlockNumber();
	}, DefaultRetryTimes, RandomRetryInterval(), false);
	log.RequestId().trace("Current BlockNumber=", blockNumber);
	return blockNumber;
}

// Get block by blockHash
export async function GetBlockByHash(blockHash: string): Promise<Block> {
	const provider = network.MyProvider.Get();
	return await util.retry.Run(async (): Promise<Block> => {
		return await provider.getBlock(blockHash);
	}, DefaultRetryTimes, RandomRetryInterval(), false);
}

// Get block timestamp by blockHash
export async function GetBlockTimestamp(blockHash: string): Promise<number> {
	if (Cache.CacheBlockTimestamp.has(blockHash)) {
		return Cache.CacheBlockTimestamp.get(blockHash);
	}
	const block = await GetBlockByHash(blockHash);
	Cache.CacheBlockTimestamp.set(blockHash, block.timestamp);
	return block.timestamp;
}

// Random retry interval
export function RandomRetryInterval(): number {
	return util.retry.RandomRetryInterval(DefaultRetryMinInterval, DefaultRetryMaxInterval);
}
