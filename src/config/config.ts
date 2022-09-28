import {config} from '@jovijovi/pedrojs-common';
import {Postgresql} from '@jovijovi/pedrojs-pg';
import {Mysql} from '@jovijovi/pedrojs-mysql';
import {Sqlite} from '@jovijovi/pedrojs-sqlite';

export namespace customConfig {
	class TxConfig {
		gasLimitC: number
		confirmations: number
	}

	class PGP {
		enable: boolean
		signingKey: string
		passphrase: string
	}

	export class Mailer {
		pgp: PGP
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

	export class WatchdogConfig {
		enable: boolean
		mailer: Mailer
		callback: string
		period: number
		addressList: WatchedAddress[]
	}

	export class CacheOptions {
		name: string
		dumpCacheInterval: number
		cacheTTL: number
		max: number
	}

	class EventListener {
		enable: boolean
		eventType: string[]
		responseCode?: string | number
		callback: string
		ownerFilter: boolean
		cache: CacheOptions[]
		contractOwners: string[]
	}

	class EventFetcher {
		enable: boolean
		eventType: string[]
		callback: string
		fromBlock: number
		maxBlockRange?: number
		pushJobIntervals?: number
		executeJobConcurrency?: number
		db: string
		contractOwners: string[]
	}

	class Events {
		listener: EventListener
		fetcher: EventFetcher
	}

	interface PostgresqlConfig extends Postgresql.Config {
		table: string
	}

	interface MysqlConfig extends Mysql.Config {
		table: string
	}

	interface SqliteConfig extends Sqlite.Config {
		table: string
	}

	class Database {
		postgres: PostgresqlConfig
		mysql: MysqlConfig
		sqlite: SqliteConfig
	}

	export class CustomConfig {
		apiResponseCode: any
		tx: TxConfig
		watchdog?: WatchdogConfig
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
	export function GetWatchdog(): WatchdogConfig {
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
	export function GetPostgresConfig(): PostgresqlConfig {
		return customConfig.database.postgres;
	}

	// GetMysqlConfig returns mysql database config
	export function GetMysqlConfig(): MysqlConfig {
		return customConfig.database.mysql;
	}

	// GetSqliteConfig returns sqlite database config
	export function GetSqliteConfig(): SqliteConfig {
		return customConfig.database.sqlite;
	}

	// GetRestAPIRspCode returns Rest API response code
	export function GetRestAPIRspCode(): any {
		if (customConfig.apiResponseCode) {
			return customConfig.apiResponseCode;
		}

		throw new Error(`GetRestAPIRspCode Failed, invalid config`);
	}
}
