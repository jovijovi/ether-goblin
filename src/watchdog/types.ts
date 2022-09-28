import {BigNumber} from 'ethers';
import {Queue} from '@jovijovi/pedrojs-common/util/queue';
import {customConfig} from '../config';

export type BalanceCache<T> = {
	[name: string]: Queue<T>;
}

export interface Balance {
	Current: BigNumber  // Current balance
	Previous: BigNumber // Previous balance
}

// Params of check address balance job
export interface CheckAddressBalanceJobParams {
	watchedAddress: customConfig.WatchedAddress
	blockNumber: number
}
