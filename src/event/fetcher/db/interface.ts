import {ModelCtor} from 'sequelize';
import {log} from '@jovijovi/pedrojs-common';
import {EventTransfer} from '../types';
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
}


