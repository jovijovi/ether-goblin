import {BigNumber} from 'ethers';
import {Queue} from '@jovijovi/pedrojs-common/util/queue';
import {customConfig} from '../config';

// Balance cache
export type BalanceCache<T> = {
	[name: string]: Queue<T>;
}

// Alert generator function
export type FuncAlertGenerator = () => [any, string];

// Balance
export interface Balance {
	Current: BigNumber  // Current balance
	Previous: BigNumber // Previous balance
}

// Params of check address balance job
export interface CheckAddressBalanceJobParams {
	watchedAddress: customConfig.WatchedAddress
	blockNumber: number
}

// Params of alert generator
export interface AlertGeneratorParams extends CheckAddressBalanceJobParams {
	balance: Balance;
}
