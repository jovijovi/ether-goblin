// Default check address list job concurrency
export const DefaultCheckAddressListJobConcurrency = 1;

// Default check address balance job concurrency
export const DefaultCheckAddressBalanceJobConcurrency = 1;

// Default loop interval (unit: ms)
export const DefaultLoopInterval = 3000;

// Default balance cache max limit
export const DefaultBalanceCacheMaxLimit = 1;

// Retry times
export const DefaultRetryTimes = 5;

// Retry min interval (unit: second)
export const DefaultRetryMinInterval = 3;

// Retry max interval (unit: second)
export const DefaultRetryMaxInterval = DefaultRetryMinInterval * 3;

// Default alert type
export const enum DefaultAlertType {
	BalanceReachLimit = 'BalanceReachLimit',
	BalanceChanges = 'BalanceChanges',
}

// Default alert mail template
export const DefaultAlertMailTemplate = {
	BalanceReachLimit: {
		Name: DefaultAlertType.BalanceReachLimit,
		Path: './template/watchdog/balance_reach_limit_alert.html'
	},
	BalanceChanges: {
		Name: DefaultAlertType.BalanceChanges,
		Path: './template/watchdog/balance_change_alert.html'
	}
}
