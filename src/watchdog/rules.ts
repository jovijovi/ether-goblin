import {customConfig} from '../config';
import {BigNumber} from 'ethers';

// IsAlert returns whether it is an alert.
// Rules:
// '<': only monitor the account balance lower than the limit.
// '>': only monitor the account balance greater than the limit.
// '=': only monitor the account balance equal the limit.
export function IsAlert(watchedAddress: customConfig.WatchedAddress, balanceNow: BigNumber): boolean {
	switch (watchedAddress.rule) {
		case '<':
			return balanceNow.lt(watchedAddress.limit);
		case '>':
			return balanceNow.gt(watchedAddress.limit);
		case '=':
			return balanceNow.eq(watchedAddress.limit);
	}

	return false;
}
