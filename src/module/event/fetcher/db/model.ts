import {DataTypes, Model} from 'sequelize';
import {EventTransfer} from '../../common/types';

export interface IMintEvents extends Model, EventTransfer {
}

// Model name
export const ModelName = 'ERC721Events';

// Model attributes
export const ModelAttrs = {
	address: {
		type: DataTypes.STRING(42),
		allowNull: false,
		primaryKey: true,
	},
	block_number: {
		type: DataTypes.BIGINT,
		allowNull: false,
		primaryKey: true,
	},
	block_hash: {
		type: DataTypes.STRING(66),
		allowNull: false,
		primaryKey: true,
	},
	block_timestamp: {
		type: DataTypes.BIGINT,
		allowNull: false,
	},
	block_datetime: {
		type: DataTypes.STRING(255),
		allowNull: false,
	},
	transaction_hash: {
		type: DataTypes.STRING(66),
		allowNull: false,
		primaryKey: true,
	},
	from: {
		type: DataTypes.STRING(42),
		allowNull: false,
	},
	to: {
		type: DataTypes.STRING(42),
		allowNull: false,
	},
	token_id: {
		type: DataTypes.TEXT,
		allowNull: false,
		primaryKey: true,
	},
	event_type: {
		type: DataTypes.TEXT,
		allowNull: true,
	},
};

export const TableName = 'events';
