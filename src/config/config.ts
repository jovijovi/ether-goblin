import {config} from '@jovijovi/pedrojs-common';

export namespace customConfig {
	class TxConfig {
		gasLimitC: number
		confirmations: number
	}

	export class Mailer {
		smtp: string
		port: number
		secure: boolean
		user: string
		password: string
		sender: string
		receivers: string[]
	}

	export class WatchedAddress {
		address: string
		rule: string
		limit: string   // limit unit is Wei
	}

	class Watchdog {
		enable: boolean
		mailer: Mailer
		period: number
		addressList: WatchedAddress[]
	}

	class TransferEvent {
		enable: boolean
		type: string[]
		responseCode?: string | number
		callback: string
	}

	class MintEvent {
		enable: boolean
		maxBlockRange?: number
		pushJobIntervals?: number
		executeJobConcurrency?: number
	}

	class Events {
		transfer: TransferEvent
		mint: MintEvent
	}

	export class CustomConfig {
		tx: TxConfig
		watchdog?: Watchdog
		events?: Events
	}

	let customConfig: CustomConfig;

	export function LoadCustomConfig() {
		customConfig = config.GetYmlConfig().custom;
	}

	export function Get() {
		return customConfig;
	}

	// GetTxConfig returns tx config
	export function GetTxConfig(): TxConfig {
		return customConfig.tx;
	}

	// GetWatchdog returns watchdog config
	export function GetWatchdog(): Watchdog {
		if (customConfig.watchdog) {
			return customConfig.watchdog;
		}

		throw new Error(`GetWatchdog Failed, invalid config`);
	}

	// GetEvents returns events config
	export function GetEvents(): Events {
		if (customConfig.events) {
			return customConfig.events;
		}

		throw new Error(`GetEvents Failed, invalid config`);
	}
}
