// Default loop interval (unit: ms)
export const DefaultLoopInterval = 3000;

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
