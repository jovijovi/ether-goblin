import {constants, utils} from 'ethers';
import {log, util} from '@jovijovi/pedrojs-common';
import fastq, {queueAsPromised} from 'fastq';
import got from 'got';
import * as network from '../../network';
import {customConfig} from '../../config';
import cron = require('node-schedule');

// Transfer Event
type EventTransfer = {
	address: string         // NFT Contract address
	blockNumber: number     // Block number
	blockHash: string       // Block hash
	transactionHash: string // Tx hash
	from: string            // From
	to: string              // To
	tokenId: number         // NFT Token ID
}

// Response of Restful API
type Response = {
	code: string
	msg: string
	data?: object
};

const EventTypeMint = 'mint';
// const EventTypeTransfer = 'transfer';
const EventTypeBurn = 'burn';

// ERC721 Transfer event name
const EventNameTransfer = 'Transfer(address,address,uint256)';

// Event queue (ASC, FIFO)
const eventQueue = new util.Queue<EventTransfer>();

// Callback job (concurrency = 10)
const callbackJob: queueAsPromised<EventTransfer> = fastq.promise(callback, 10);

// Check if tx is ERC721 transfer
function checkTx(tx: any): boolean {
	if (!tx || !tx.topics) {
		return false;
	} else if (tx.topics.length == 4
		&& tx.topics[0]
		&& tx.topics[1]
		&& tx.topics[2]
		&& tx.topics[3]) {
		return true;
	}

	return false;
}

export function Run() {
	// Check config
	const conf = customConfig.GetEvents();
	if (!conf) {
		log.RequestId().info('No events configuration, skipped.');
		return;
	} else if (!conf.transfer.enable) {
		log.RequestId().info('Transfer event listener disabled.');
		return;
	}

	log.RequestId().info("Transfer event listener is running...");

	const provider = network.MyProvider.Get();
	const evtFilter = {
		topics: [
			utils.id(EventNameTransfer)
		]
	};

	provider.on(evtFilter, (tx) => {
		try {
			// Check Tx
			if (!checkTx(tx)) {
				return;
			}

			// Check from
			if (tx.topics[1] == constants.HashZero && !conf.transfer.type.includes(EventTypeMint)) {
				log.RequestId().trace("Mint event, skipped");
				return;
			}

			// Check to
			else if (tx.topics[2] == constants.HashZero && !conf.transfer.type.includes(EventTypeBurn)) {
				log.RequestId().trace("Burn event, skipped");
				return;
			}

			// Build event
			const evt: EventTransfer = {
				address: tx.address,
				blockNumber: tx.blockNumber,
				blockHash: tx.blockHash,
				transactionHash: tx.transactionHash,
				from: utils.hexZeroPad(utils.hexValue(tx.topics[1]), 20),
				to: utils.hexZeroPad(utils.hexValue(tx.topics[2]), 20),
				tokenId: Number(utils.hexValue(tx.topics[3])),
			}

			// Push event to queue
			eventQueue.Push(evt);
		} catch (e) {
			log.RequestId().error(e);
		}
	});

	// TODO: improve performance
	cron.scheduleJob('*/3 * * * * *', function () {
		if (eventQueue.Length() == 0) {
			return;
		}

		const evt = eventQueue.Shift();
		if (!evt) {
			log.RequestId().warn("Event is nil");
			return;
		}

		log.RequestId().debug("Processing event:", evt);
		callbackJob.push(evt).catch((err) => log.RequestId().error(err));
	});

	return;
}

// checkRspCode check response code (NOT HTTP status code)
function checkRspCode(code: string | number, ok: string | number): boolean {
	return code === ok;
}

// Event callback
async function callback(evt: EventTransfer): Promise<void> {
	try {
		const conf = customConfig.GetEvents();

		// Check URL
		if (!conf.transfer.callback) {
			log.RequestId().warn("Callback URL is empty");
			return;
		}

		// Callback
		const rsp: Response = await got.post(conf.transfer.callback, {
			json: evt
		}).json();
		log.RequestId().trace("Callback response=", rsp);

		// Check response
		if (!checkRspCode(rsp.code, conf.transfer.responseCode)) {
			log.RequestId().error("Callback failed, code=%s, msg=%s", rsp.code, rsp.msg);
			return;
		}
	} catch (e) {
		log.RequestId().error("Callback failed, error=", e);
		return;
	}

	return;
}
