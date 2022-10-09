import {Sequelize} from 'sequelize';
import {Mysql} from '@jovijovi/pedrojs-mysql';
import {customConfig} from '../../../../config';
import {IMintEvents, ModelAttrs, ModelName, TableName} from './model';
import {Database} from './interface';

export class MysqlDB extends Database {
	private _engine: Sequelize;

	// Connect database
	async Connect() {
		if (this._engine) {
			return;
		}

		// Connect
		const e = Mysql.Connect({
			uri: customConfig.GetMysqlConfig().uri,
		});

		// Ping
		await Mysql.Ping(e);

		// Model options
		const opts = {
			tableName: customConfig.GetMysqlConfig().table ? customConfig.GetMysqlConfig().table : TableName,
			timestamps: false,
		};

		// Define model
		this.ModelEvent = e.define<IMintEvents>(ModelName, ModelAttrs, opts);

		// Creates the table if it doesn't exist (and does nothing if it already exists)
		await this.ModelEvent.sync();

		this._engine = e;
	}
}

export const MysqlClient = new MysqlDB();
