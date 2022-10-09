import {DataTypes, Model} from 'sequelize';
import {EventTransfer} from '../../common/types';

export interface IMintEvents extends Model, EventTransfer {
}

// Model name
export const ModelName = 'ERC721Events';

// Model attributes
export const ModelAttrs = {
	address: {
		type: DataTypes.TEXT,
		allowNull: false,
		primaryKey: true,
	},
	blockNumber: {
		type: DataTypes.TEXT,
		allowNull: false,
		primaryKey: true,
	},
	blockHash: {
		type: DataTypes.TEXT,
		allowNull: false,
	},
	transactionHash: {
		type: DataTypes.TEXT,
		allowNull: false,
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
		primaryKey: true,
	},
};

export const TableName = 'events';
