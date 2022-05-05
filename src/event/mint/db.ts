import {Sqlite} from '@jovijovi/pedrojs-sqlite';
import {DataTypes, Model, ModelCtor} from 'sequelize';
import {EventTransfer} from './types';
import {log} from "@jovijovi/pedrojs-common";

interface IMintEvents extends Model, EventTransfer {
}

// Model attributes
const modelAttrs = {
	address: {
		type: DataTypes.TEXT,
		allowNull: false,
	},
	blockNumber: {
		type: DataTypes.TEXT,
		allowNull: false,
	},
	blockHash: {
		type: DataTypes.TEXT,
		allowNull: false,
	},
	transactionHash: {
		type: DataTypes.TEXT,
		primaryKey: true,
	},
	from: {
		type: DataTypes.TEXT,
		allowNull: false,
	},
	to: {
		type: DataTypes.TEXT,
		allowNull: false,
	},
	tokenId: {
		type: DataTypes.TEXT,
		allowNull: false,
	},
};

const tableName = 'mint_events';

let MintEvents: ModelCtor<IMintEvents>;

export async function Connect(): Promise<Sqlite.Engine> {
	// Connect
	const engine = Sqlite.Connect({
		uri: 'sqlite://./database/mint_events.db',
	});

	// Ping
	await engine.Ping();

	// Model options
	const opts = {
		tableName: tableName,
		timestamps: false,
	};

	// Define model
	MintEvents = engine.client.define<IMintEvents>('MintEvents', modelAttrs, opts);

	// Creates the table if it doesn't exist (and does nothing if it already exists)
	await MintEvents.sync();

	return engine;
}

// Save event to database
export async function Save(evt: EventTransfer): Promise<any> {
	try {
		return await MintEvents.upsert(
			{
				address: evt.address,                       // NFT Contract address
				blockNumber: evt.blockNumber.toString(),    // Block number
				blockHash: evt.blockHash,                   // Block hash
				transactionHash: evt.transactionHash,       // Tx hash
				from: evt.from,                             // From
				to: evt.to,                                 // To
				tokenId: evt.tokenId.toString(),            // NFT Token ID
			}
		);
	} catch (e) {
		log.RequestId().error('Save event failed, error=', e.message);
	}

	return;
}
