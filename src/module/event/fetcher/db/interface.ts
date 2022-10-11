import {ModelCtor} from 'sequelize';
import {log, util} from '@jovijovi/pedrojs-common';
import {EventTransfer} from '../../common/types';
import {IMintEvents} from './model';

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
					block_datetime: util.time.GetUnixTimestamp(evt.blockTimestamp, 'UTC'),  // Block datetime
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
}


