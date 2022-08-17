import {customConfig} from '../config';
import {Balance} from './types';
import {DefaultAlertType} from './params';

// IsAlert returns whether it is an alert
// Rules:
// '<': only monitor the account balance lower than the limit
// '>': only monitor the account balance greater than the limit
// '=': only monitor the account balance equal the limit
// '+': only monitor the account balance increase (must set period to 1)
// '-': only monitor the account balance decrease (must set period to 1)
// '*': monitor all account balance changes (must set period to 1)
export function IsAlert(watchedAddress: customConfig.WatchedAddress, balance: Balance): [boolean, DefaultAlertType] {
	switch (watchedAddress.rule) {
		case '<':
			return [balance.Now.lt(watchedAddress.limit), DefaultAlertType.BalanceReachLimit];
		case '>':
			return [balance.Now.gt(watchedAddress.limit), DefaultAlertType.BalanceReachLimit];
		case '=':
			return [balance.Now.eq(watchedAddress.limit), DefaultAlertType.BalanceReachLimit];
		case '+':
			return [balance.Now.gt(balance.Past), DefaultAlertType.BalanceChanges];
		case '-':
			return [balance.Now.lt(balance.Past), DefaultAlertType.BalanceChanges];
		case '*':
			return [!balance.Now.eq(balance.Past), DefaultAlertType.BalanceChanges];
	}

	return [false, undefined];
}
