import {config} from '@jovijovi/pedrojs-common';
import {Postgresql} from '@jovijovi/pedrojs-pg';
import {Mysql} from '@jovijovi/pedrojs-mysql';

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
		callback: string
		period: number
		addressList: WatchedAddress[]
	}

	class TransferEvent {
		enable: boolean
		type: string[]
		responseCode?: string | number
		callback: string
		ownerFilter: boolean
		contractOwners: string[]
	}

	class MintEvent {
		enable: boolean
		maxBlockRange?: number
		pushJobIntervals?: number
		executeJobConcurrency?: number
		db: string
		contractOwners: string[]
	}

	class Events {
		transfer: TransferEvent
		mint: MintEvent
	}

	class Database {
		postgres: Postgresql.Config
		mysql: Mysql.Config
	}

	export class CustomConfig {
		tx: TxConfig
		watchdog?: Watchdog
		events?: Events
		database?: Database
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

	// GetPostgresConfig returns postgres database config
	export function GetPostgresConfig(): Postgresql.Config {
		return customConfig.database.postgres;
	}

	// GetMysqlConfig returns mysql database config
	export function GetMysqlConfig(): Mysql.Config {
		return customConfig.database.mysql;
	}
}
