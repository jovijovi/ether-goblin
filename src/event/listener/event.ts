import {utils} from 'ethers';
import got from 'got';
import fastq, {queueAsPromised} from 'fastq';
import {log, util} from '@jovijovi/pedrojs-common';
import {network} from '@jovijovi/ether-network';
import {customConfig} from '../../config';
import {DefaultCallbackJobConcurrency, DefaultDumpCacheInterval, DefaultLoopInterval} from './params';
import {EventNameTransfer, TimeSecondInMs} from '../common';
import {EventTransfer, Response} from './types';
import {GetContractOwner} from './abi';
import {DumpCacheToFile, GetContractOwnerCacheConfig, InitCache, LoadCacheFromFile} from './cache';
import {CheckEventType, CheckTopics} from '../utils';

// Event queue (ASC, FIFO)
const eventQueue = new util.Queue<EventTransfer>();

// Callback job
const callbackJob: queueAsPromised<EventTransfer> = fastq.promise(callback, DefaultCallbackJobConcurrency);

export function Run() {
	// Check config
	const conf = customConfig.GetEvents();
	if (!conf) {
		log.RequestId().info('No events configuration, skipped.');
		return;
	} else if (!conf.listener.enable) {
		log.RequestId().info('Event listener disabled.');
		return;
	}

	log.RequestId().info("Event listener Config=", conf.listener);

	// Initialize cache
	InitCache();

	// Load contract owner cache from dump file (Optional)
	try {
		const size = LoadCacheFromFile();
		log.RequestId().info("Cache(ContractOwner) loaded. Size=", size);
	} catch (e) {
		log.RequestId().warn("Load cache(ContractOwner) failed, error=", e);
	}

	log.RequestId().info("Event listener is running...");

	const provider = network.MyProvider.Get();
	const evtFilter = {
		topics: [
			utils.id(EventNameTransfer)
		]
	};

	provider.on(evtFilter, (tx) => {
		try {
			if (!CheckTopics(tx.topics)) {
				return;
			}

			if (!CheckEventType(tx.topics, conf.listener.eventType)) {
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

	// Dump contract owner cache (Optional)
	const contractOwnerCacheConf = GetContractOwnerCacheConfig();
	setInterval(async () => {
		try {
			const size = await DumpCacheToFile();
			log.RequestId().debug("Cache(ContractOwner) dumped. Size=", size);
		} catch (e) {
			log.RequestId().warn("Dump cache(ContractOwner) failed, error=", e);
			return;
		}
	}, contractOwnerCacheConf.dumpCacheInterval ? TimeSecondInMs * contractOwnerCacheConf.dumpCacheInterval : DefaultDumpCacheInterval);

	return;
}

// checkContract check contract owner
async function checkContract(address: string): Promise<boolean> {
	try {
		const conf = customConfig.GetEvents();

		// Filters contract address by owner
		if (conf.listener.ownerFilter && conf.listener.contractOwners) {
			const contractOwner = await GetContractOwner(address);
			if (!contractOwner) {
				return false;
			}

			if (!conf.listener.contractOwners.map(x => utils.getAddress(x)).includes(utils.getAddress(contractOwner))) {
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
		if (!conf.listener.callback) {
			log.RequestId().warn("Callback URL is empty");
			return;
		}

		// Check contract owner
		if (!await checkContract(evt.address)) {
			return;
		}

		// Callback
		log.RequestId().debug("Calling back(%s)... event:", conf.listener.callback, evt);
		const rsp: Response = await got.post(conf.listener.callback, {
			json: evt
		}).json();
		log.RequestId().trace("Callback response=", rsp);

		// Check response
		if (!checkRspCode(rsp.code, conf.listener.responseCode)) {
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
