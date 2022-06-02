import {Sqlite} from '@jovijovi/pedrojs-sqlite';
import {IMintEvents, ModelAttrs, TableName} from './model';
import {Database} from './interface';

export class SqliteDB extends Database {
	async Connect(): Promise<Sqlite.Engine> {
		// Connect
		const engine = Sqlite.Connect({
			uri: 'sqlite://./database/mint_events.db',
		});

		// Ping
		await engine.Ping();

		// Model options
		const opts = {
			tableName: TableName,
			timestamps: false,
		};

		// Define model
		this.ModelEvent = engine.client.define<IMintEvents>('mintEvents', ModelAttrs, opts);

		// Creates the table if it doesn't exist (and does nothing if it already exists)
		await this.ModelEvent.sync();

		return engine;
	}
}

export const SqliteClient = new SqliteDB();
