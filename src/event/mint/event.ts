import {constants, utils} from 'ethers';
import {auditor, log, util} from '@jovijovi/pedrojs-common';
import fastq, {queueAsPromised} from 'fastq';
import * as network from '../../network';
import {Options} from './options';
import {Core} from '../../eth';
import {
	DefaultExecuteJobConcurrency,
	DefaultMaxBlockRange,
	DefaultPushJobIntervals,
	DefaultQueryIntervals,
	EventNameTransfer
} from './params';
import {EventTransfer} from './types';
import {customConfig} from '../../config';
import * as db from './db';
import cron = require('node-schedule');

// Event queue (ASC, FIFO)
const eventQueue = new util.Queue<EventTransfer>();

// Query mint events job
const queryMintEventsJob: queueAsPromised<Options> = fastq.promise(queryMintEvents, 1);

// Execute query job
let execQueryJob: queueAsPromised<Options>;

// Dump job
const dumpJob: queueAsPromised<util.Queue<EventTransfer>> = fastq.promise(dump, 1);

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

// Execute query mint events job
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

// Generate query mint events job
async function queryMintEvents(opts: Options = {
	fromBlock: 0,
	maxBlockRange: DefaultMaxBlockRange,
	pushJobIntervals: DefaultPushJobIntervals,
}): Promise<void> {
	let nextFrom = opts.fromBlock;
	let nextTo = 0;
	let blockRange = opts.maxBlockRange;
	let leftBlocks = 0;
	let blockNumber = await Core.GetBlockNumber();

	// Connect to database
	await db.Connect();

	do {
		leftBlocks = blockNumber - nextFrom;
		if (leftBlocks <= 0) {
			await util.time.SleepSeconds(DefaultQueryIntervals);
			blockNumber = await Core.GetBlockNumber();
			continue;
		}

		blockRange = leftBlocks < opts.maxBlockRange ? leftBlocks : opts.maxBlockRange;

		nextTo = nextFrom + blockRange;
		execQueryJob.push({
			fromBlock: nextFrom,
			toBlock: nextTo,
		}).catch((err) => log.RequestId().error(err));
		log.RequestId().info("PUSH Job[%d,%d]", nextFrom, nextTo);

		nextFrom = nextTo + 1;

		await util.time.SleepMilliseconds(opts.pushJobIntervals);
	} while (nextFrom > 0);

	return;
}

export function Run() {
	// Check config
	const conf = customConfig.GetEvents();
	if (!conf) {
		log.RequestId().info('No events configuration, skipped.');
		return;
	} else if (!conf.mint.enable) {
		log.RequestId().info('Query mint events job disabled.');
		return;
	}

	log.RequestId().info("Querying mint events job config=", conf.mint);

	auditor.Check(conf.mint.executeJobConcurrency >= 1, "Invalid executeJobConcurrency");

	execQueryJob = fastq.promise(execQuery, conf.mint.executeJobConcurrency ? conf.mint.executeJobConcurrency : DefaultExecuteJobConcurrency);

	log.RequestId().info("Querying mint events job is running...");

	// Push query mint events job to scheduler
	queryMintEventsJob.push({
		fromBlock: 0,
		maxBlockRange: conf.mint.maxBlockRange,
		pushJobIntervals: conf.mint.pushJobIntervals,
	}).catch((err) => log.RequestId().error(err));

	// Schedule processing job
	cron.scheduleJob('*/3 * * * * *', function () {
		auditor.Check(eventQueue, "Event queue is nil");
		if (eventQueue.Length() == 0) {
			return;
		}

		dumpJob.push(eventQueue).catch((err) => log.RequestId().error(err));
	});

	return;
}

// Dump events
async function dump(queue: util.Queue<EventTransfer>): Promise<void> {
	try {
		const len = queue.Length();
		if (len === 0) {
			return;
		}

		for (let i = 0; i < len; i++) {
			const evt = queue.Shift();
			// Dump event to database
			await db.Save(evt);
			log.RequestId().info("Count=%d, evt=%o", i + 1, evt);
		}
	} catch (e) {
		log.RequestId().error("Callback failed, error=", e);
		return;
	}

	return;
}
