import fastq, {queueAsPromised} from 'fastq';
import {auditor, log, util} from '@jovijovi/pedrojs-common';
import {EventTransfer} from '../common/types';
import {customConfig} from '../../../config';
import {DefaultChunkSize, DefaultLoopInterval} from './params';
import {DB} from './db';
import {NewJobID} from '../utils';

// Event queue (ASC, FIFO)
const eventQueue = new util.Queue<EventTransfer>();

// Dump job
const dumpJob: queueAsPromised<util.Queue<EventTransfer>> = fastq.promise(dump, 1);

// Schedule dump job
export async function Run() {
	let isEmpty = true;
	setInterval(() => {
		auditor.Check(eventQueue, "Event queue is nil");
		if (eventQueue.Length() === 0) {
			if (!isEmpty) {
				log.RequestId().info("All events dumped, queue is empty");
				isEmpty = true;
			}
			return;
		}

		dumpJob.push(eventQueue).catch((err) => log.RequestId().error(err));
		isEmpty = false;
	}, DefaultLoopInterval);
}

export function Push(evt: EventTransfer) {
	eventQueue.Push(evt);
}

// Dump events
async function dump(queue: util.Queue<EventTransfer>): Promise<void> {
	try {
		const len = queue.Length();
		if (len === 0) {
			return;
		}

		const conf = customConfig.GetEvents().fetcher;
		const defaultChunkSize = conf.chunkSize ? conf.chunkSize : DefaultChunkSize;
		const jobId = NewJobID();

		let leftEvents = len;
		do {
			const chunkSize = leftEvents < defaultChunkSize ? leftEvents : defaultChunkSize;

			const events = [];
			for (let i = 0; i < chunkSize; i++) {
				const evt = queue.Shift();

				events.push({
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
				});
			}

			// Save events in bulk
			await DB.Client().BulkSave(events);

			// Calc left events
			leftEvents -= chunkSize;

			log.RequestId().debug("EXEC JOB(Dump|id:%s), %d events dumped, progress=%d%(%d/%d), lastBlockInChunk=%s",
				jobId,
				events.length,
				((len - leftEvents) * 100 / len).toFixed(1),
				len - leftEvents,
				len,
				events[chunkSize - 1].block_number,
			);
		} while (leftEvents > 0);
	} catch (e) {
		log.RequestId().error("Dump failed, error=", e);
		return;
	}

	return;
}
