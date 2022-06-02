import {DataTypes, Model} from 'sequelize';
import {EventTransfer} from '../types';

export interface IMintEvents extends Model, EventTransfer {
}

// Model attributes
export const ModelAttrs = {
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

export const TableName = 'mint_events';
