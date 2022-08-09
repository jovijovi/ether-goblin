import {constants, utils} from 'ethers';
import {auditor, log, util} from '@jovijovi/pedrojs-common';
import fastq, {queueAsPromised} from 'fastq';
import {network} from '@jovijovi/ether-network';
import {Options} from './options';
import {core} from '@jovijovi/ether-core';
import {
	DefaultExecuteJobConcurrency,
	DefaultLoopInterval,
	DefaultMaxBlockRange,
	DefaultPushJobIntervals,
	DefaultQueryIntervals,
	DefaultRetryInterval,
	DefaultRetryTimes,
} from './params';
import {EventTransfer} from './types';
import {customConfig} from '../../config';
import {DB} from './db';
import {CheckEventType, CheckTopics} from '../utils';

// Event queue (ASC, FIFO)
const eventQueue = new util.Queue<EventTransfer>();

// Query mint events job
const queryMintEventsJob: queueAsPromised<Options> = fastq.promise(queryMintEvents, 1);

// Execute query job
let execQueryJob: queueAsPromised<Options>;

// Dump job
const dumpJob: queueAsPromised<util.Queue<EventTransfer>> = fastq.promise(dump, 1);

// Execute query mint events job
async function execQuery(opts: Options = {
	fromBlock: 0
}): Promise<void> {
	log.RequestId().info("EXEC JOB, blocks[%d,%d], execQueryJob=%d", opts.fromBlock, opts.toBlock, execQueryJob.length());

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

	const events = await util.retry.Run(async (): Promise<Array<Log>> => {
		return await provider.getLogs(evtFilter);
	}, DefaultRetryTimes, DefaultRetryInterval);

	for (const event of events) {
		// Check event topics
		if (!CheckTopics(event.topics)) {
			continue;
		}

		if (!CheckEventType(event.topics, opts.eventType)) {
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
	let blockNumber = await core.GetBlockNumber();

	// Connect to database
	await DB.Connect();

	do {
		leftBlocks = blockNumber - nextFrom;
		if (leftBlocks <= 0) {
			await util.time.SleepSeconds(DefaultQueryIntervals);
			blockNumber = await core.GetBlockNumber();
			continue;
		}

		blockRange = leftBlocks < opts.maxBlockRange ? leftBlocks : opts.maxBlockRange;
		nextTo = nextFrom + blockRange;

		if (blockRange >= 0 && blockRange <= 1) {
			log.RequestId().info("Catch up the latest block(%d)", blockNumber);
		}
		log.RequestId().info("PUSH JOB, blocks[%d,%d](range=%d), execQueryJob=%d", nextFrom, nextTo, blockRange, execQueryJob.length());

		execQueryJob.push({
			fromBlock: nextFrom,
			toBlock: nextTo,
		}).catch((err) => log.RequestId().error(err));

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
	} else if (!conf.fetcher.enable) {
		log.RequestId().info('Event fetcher disabled.');
		return;
	}

	log.RequestId().info("Event fetcher config=", conf.fetcher);

	auditor.Check(conf.fetcher.executeJobConcurrency >= 1, "Invalid executeJobConcurrency");

	execQueryJob = fastq.promise(execQuery, conf.fetcher.executeJobConcurrency ? conf.fetcher.executeJobConcurrency : DefaultExecuteJobConcurrency);

	log.RequestId().info("Event fetcher is running...");

	// Push query mint events job to scheduler
	queryMintEventsJob.push({
		fromBlock: 0,
		maxBlockRange: conf.fetcher.maxBlockRange,
		pushJobIntervals: conf.fetcher.pushJobIntervals,
	}).catch((err) => log.RequestId().error(err));

	// Schedule processing job
	setInterval(() => {
		auditor.Check(eventQueue, "Event queue is nil");
		if (eventQueue.Length() == 0) {
			return;
		}

		dumpJob.push(eventQueue).catch((err) => log.RequestId().error(err));
	}, DefaultLoopInterval);

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
			await DB.Client().Save(evt);
			log.RequestId().info("Count=%d, evt=%o", i + 1, evt);
		}
	} catch (e) {
		log.RequestId().error("Callback failed, error=", e);
		return;
	}

	return;
}
