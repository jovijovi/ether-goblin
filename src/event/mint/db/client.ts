import {customConfig} from '../../../config';
import {auditor} from '@jovijovi/pedrojs-common';
import {PostgresClient, PostgresDB} from './postgres';
import {SqliteClient, SqliteDB} from './sqlite3';

const enum DatabaseType {
	Postgres = 'postgres',
	Sqlite = 'sqlite',
}

class DBClient {
	private _client: PostgresDB | SqliteDB;

	async Connect() {
		auditor.Check(customConfig.GetEvents().mint.db, "Database config is empty");
		switch (customConfig.GetEvents().mint.db) {
			case DatabaseType.Postgres:
				await PostgresClient.Connect();
				this._client = PostgresClient;
				break;
			case DatabaseType.Sqlite:
				await SqliteClient.Connect();
				this._client = SqliteClient;
				break;
		}
	}

	Client() {
		return this._client;
	}
}

export const DB = new DBClient();
