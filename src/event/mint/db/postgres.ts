import {Sequelize} from 'sequelize';
import {Postgresql} from '@jovijovi/pedrojs-pg';
import {customConfig} from '../../../config';
import {IMintEvents, ModelAttrs, TableName} from './model';
import {Database} from './interface';

export class PostgresDB extends Database {
	private _engine: Sequelize;

	// Connect database
	async Connect() {
		if (this._engine) {
			return;
		}

		// Connect
		const e = Postgresql.Connect({
			uri: customConfig.GetPostgresConfig().uri,
		});

		// Ping
		await Postgresql.Ping(e);

		// Model options
		const opts = {
			tableName: TableName,
			timestamps: false,
		};

		// Define model
		this.ModelEvent = e.define<IMintEvents>('MintEvents', ModelAttrs, opts);

		// Creates the table if it doesn't exist (and does nothing if it already exists)
		await this.ModelEvent.sync();

		this._engine = e;
	}
}

export const PostgresClient = new PostgresDB();
