import {BigNumber} from 'ethers';
import {Queue} from '@jovijovi/pedrojs-common/util/queue';

export type BalanceCache<T> = {
	[name: string]: Queue<T>;
}

export interface Balance {
	Now: BigNumber
	Past: BigNumber
}
