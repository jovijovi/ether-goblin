import {constants, utils} from 'ethers';
import {auditor, log, util} from '@jovijovi/pedrojs-common';
import fastq, {queueAsPromised} from 'fastq';
import * as network from '../../network';
import {Options} from './options';
import {Core} from '../../eth';
import {DefaultIntervalBlocks} from './params';
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

// Event queue (ASC, FIFO)
const eventQueue = new util.Queue<EventTransfer>();

// Query mint events job
const queryMintEventsJob: queueAsPromised<Options> = fastq.promise(queryMintEvents, 1);    // Job: Check balance

// Execute query job
const execQueryJob: queueAsPromised<Options> = fastq.promise(execQuery, 1);    // Job: Check balance

// Callback job (concurrency = 10)
const callbackJob: queueAsPromised<util.Queue<EventTransfer>> = fastq.promise(callback, 1);

// Check if event topics is ERC721 transfer
function checkEvent(evt: any): boolean {
	if (!evt || !evt.topics) {
		return false;
	} else if (evt.topics.length == 4
		&& evt.topics[0]
		&& evt.topics[1]
		&& evt.topics[2]
		&& evt.topics[3]) {
		return true;
	}

	return false;
}

// ERC721 Mint event name
const EventNameTransfer = 'Transfer(address,address,uint256)';

async function execQuery(opts: Options = {
	fromBlock: 0
}): Promise<void> {
	log.RequestId().info("EXEC Job[%d,%d]", opts.fromBlock, opts.toBlock);

	const provider = network.MyProvider.Get();
	const evtFilter = {
		address: opts.address,
		fromBlock: opts.fromBlock,
		toBlock: opts.toBlock,
		topics: [
			utils.id(EventNameTransfer),
			null,
		]
	};

	const events = await provider.getLogs(evtFilter);

	for (const event of events) {
		// Check event
		if (!checkEvent(event)) {
			return;
		}

		// Check from
		if (event.topics[1] != constants.HashZero) {
			log.RequestId().trace("NOT Mint event");
			continue;
		}

		// Build event
		const evt: EventTransfer = {
			address: event.address,
			blockNumber: event.blockNumber,
			blockHash: event.blockHash,
			transactionHash: event.transactionHash,
			from: utils.hexZeroPad(utils.hexValue(event.topics[1]), 20),
			to: utils.hexZeroPad(utils.hexValue(event.topics[2]), 20),
			tokenId: Number(utils.hexValue(event.topics[3])),
		}

		// Push event to queue
		eventQueue.Push(evt);
	}

	return;
}


async function queryMintEvents(opts: Options = {
	fromBlock: 0
}): Promise<void> {
	let nextFrom = opts.fromBlock;
	let nextTo = 0;
	let intervalBlocks = DefaultIntervalBlocks;
	let leftBlocks = 0;
	let blockNumber = await Core.GetBlockNumber();

	do {
		leftBlocks = blockNumber - nextFrom;
		if (leftBlocks <= 0) {
			await util.time.SleepSeconds(3);
			blockNumber = await Core.GetBlockNumber();
			continue;
		}

		intervalBlocks = leftBlocks < DefaultIntervalBlocks ? leftBlocks : DefaultIntervalBlocks;

		nextTo = nextFrom + intervalBlocks;
		execQueryJob.push({
			fromBlock: nextFrom,
			toBlock: nextTo,
		}).catch((err) => log.RequestId().error(err));
		log.RequestId().info("PUSH Job[%d,%d]", nextFrom, nextTo);

		nextFrom = nextTo + 1;

		await util.time.SleepMilliseconds(500);
	} while (nextFrom > 0);

	return;
}

// TODO: add config
export function Run() {
	log.RequestId().info("Querying mint events job is running...");

	queryMintEventsJob.push({
		fromBlock: 0,
	}).catch((err) => log.RequestId().error(err));

	// Schedule processing job
	cron.scheduleJob('*/3 * * * * *', function () {
		auditor.Check(eventQueue, "Event queue is nil");
		if (eventQueue.Length() == 0) {
			return;
		}

		callbackJob.push(eventQueue).catch((err) => log.RequestId().error(err));
	});

	return;
}

// TODO: Event callback
async function callback(queue: util.Queue<EventTransfer>): Promise<void> {
	try {
		const len = queue.Length();
		if (len === 0) {
			return;
		}

		for (let i = 0; i < len; i++) {
			const evt = queue.Shift();
			log.RequestId().info("Count=%d, evt=%o", i + 1, evt);
		}
	} catch (e) {
		log.RequestId().error("Callback failed, error=", e);
		return;
	}

	return;
}
