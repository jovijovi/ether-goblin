import {constants, utils} from 'ethers';
import {log, util} from '@jovijovi/pedrojs-common';
import fastq, {queueAsPromised} from 'fastq';
import got from 'got';
import {network} from '@jovijovi/ether-network';
import {customConfig} from '../../config';
import {
	DefaultCallbackJobConcurrency,
	DefaultLoopInterval,
	EventNameTransfer,
	EventTypeBurn,
	EventTypeMint
} from './params';
import {EventTransfer, Response} from './types';
import {GetContractOwner} from './abi';

// Event queue (ASC, FIFO)
const eventQueue = new util.Queue<EventTransfer>();

// Callback job
const callbackJob: queueAsPromised<EventTransfer> = fastq.promise(callback, DefaultCallbackJobConcurrency);

// Check if tx is ERC721 transfer
function checkTx(tx: any): boolean {
	if (!tx || !tx.topics) {
		return false;
	} else if (tx.topics.length === 4
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
			if (tx.topics[1] === constants.HashZero && !conf.transfer.type.includes(EventTypeMint)) {
				log.RequestId().trace("Mint event, skipped");
				return;
			}

			// Check to
			else if (tx.topics[2] === constants.HashZero && !conf.transfer.type.includes(EventTypeBurn)) {
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

	setInterval(() => {
		try {
			const len = eventQueue.Length();
			if (len === 0) {
				return;
			}

			for (let i = 0; i < len; i++) {
				const evt = eventQueue.Shift();
				if (!evt) {
					log.RequestId().warn("Event is nil");
					return;
				}

				log.RequestId().trace("Processing event:", evt);
				callbackJob.push(evt).catch((err) => log.RequestId().error(err));
			}
		} catch (e) {
			log.RequestId().error("Push callback job failed, error=", e);
			return;
		}
	}, DefaultLoopInterval);

	return;
}

// checkContract check contract owner
async function checkContract(address: string): Promise<boolean> {
	try {
		const conf = customConfig.GetEvents();

		// Filters contract address by owner
		if (conf.transfer.ownerFilter && conf.transfer.contractOwners) {
			const contractOwner = await GetContractOwner(address);
			if (!contractOwner) {
				return false;
			}

			if (!conf.transfer.contractOwners.map(x => utils.getAddress(x)).includes(utils.getAddress(contractOwner))) {
				log.RequestId().trace("Not contract(%s) owner, skipped", address);
				return false;
			}
		}
	} catch (e) {
		log.RequestId().error("CheckContract failed, error=", e);
		return false;
	}

	return true;
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

		// Check contract owner
		if (!await checkContract(evt.address)) {
			return;
		}

		// Callback
		log.RequestId().debug("Calling back(%s)... event:", conf.transfer.callback, evt);
		const rsp: Response = await got.post(conf.transfer.callback, {
			json: evt
		}).json();
		log.RequestId().trace("Callback response=", rsp);

		// Check response
		if (!checkRspCode(rsp.code, conf.transfer.responseCode)) {
			log.RequestId().error("Callback failed, code=%s, msg=%s", rsp.code, rsp.msg);
			return;
		}
		log.RequestId().info("Processed event:", evt);
	} catch (e) {
		log.RequestId().error("Callback failed, error=", e);
		return;
	}

	return;
}
