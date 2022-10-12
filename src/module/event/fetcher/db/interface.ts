import {ModelCtor} from 'sequelize';
import {log} from '@jovijovi/pedrojs-common';
import {EventTransfer} from '../../common/types';
import {IMintEvents} from './model';
import {IQuery} from './types';

interface IDatabase {
	ModelEvent: ModelCtor<IMintEvents>;

	Save(evt: EventTransfer): Promise<any>;
}

export class Database implements IDatabase {
	public ModelEvent: ModelCtor<IMintEvents>;

	// Save event to database
	async Save(evt: EventTransfer): Promise<any> {
		try {
			return await this.ModelEvent.upsert(
				{
					address: evt.address,                       // NFT Contract address
					block_number: evt.blockNumber.toString(),   // Block number
					block_hash: evt.blockHash,                  // Block hash
					block_timestamp: evt.blockTimestamp,        // Block timestamp
					block_datetime: evt.blockDatetime,          // Block datetime
					transaction_hash: evt.transactionHash,      // Tx hash
					from: evt.from,                             // From
					to: evt.to,                                 // To
					token_id: evt.tokenId.toString(),           // NFT Token ID
					event_type: evt.eventType                   // Event type
				}
			);
		} catch (e) {
			log.RequestId().error('Save event failed, error=', e.message);
		}

		return;
	}

	// Save records in bulk, ignore duplicates
	async BulkSave(records: any[]): Promise<any> {
		try {
			await this.ModelEvent.bulkCreate(records,
				{
					ignoreDuplicates: true,
				}
			);
		} catch (e) {
			log.RequestId().error('BulkSave failed, error=', e.message);
		}
	}

	// Check if exists
	async IsExists(query: IQuery): Promise<boolean> {
		try {
			return await this.ModelEvent.count({
				where: {
					address: query.address,
					block_number: query.blockNumber,
					transaction_hash: query.transactionHash,
					token_id: query.tokenId,
				},
			}) > 0;
		} catch (e) {
			log.RequestId().error('IsExist failed, error=', e.message);
		}
	}

	// Query token history(all event types) order by 'block_number' ASC
	async QueryTokenHistory(address: string, tokenId: string): Promise<any> {
		try {
			return await this.ModelEvent.findAll(
				{
					where: {
						address: address,
						token_id: tokenId,
					},
					order: [
						['block_number', 'ASC'],
					],
				});
		} catch (e) {
			log.RequestId().error('Query failed, error=', e.message);
		}
	}
}
