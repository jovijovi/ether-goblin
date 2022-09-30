import {utils} from 'ethers';
import {Log} from '@ethersproject/abstract-provider';
import {auditor, log, util} from '@jovijovi/pedrojs-common';
import fastq, {queueAsPromised} from 'fastq';
import got from 'got';
import {network} from '@jovijovi/ether-network';
import {Options} from './options';
import {core} from '@jovijovi/ether-core';
import {
	DefaultExecuteJobConcurrency,
	DefaultFromBlock,
	DefaultKeepRunning,
	DefaultLoopInterval,
	DefaultMaxBlockRange,
	DefaultPushJobIntervals,
	DefaultQueryIntervals,
	DefaultRetryInterval,
	DefaultRetryTimes,
} from './params';
import {EventTransfer, Response} from '../common/types';
import {customConfig} from '../../../config';
import {DB} from './db';
import {EventNameTransfer, EventTypeMint} from '../common/constants';
import {CheckEventType, CheckTopics} from '../utils';

// Event queue (ASC, FIFO)
const eventQueue = new util.Queue<EventTransfer>();

// Fetch events jobs
const fetchEventsJobs: queueAsPromised<Options> = fastq.promise(fetchEvents, 1);

// Query logs jobs
let queryLogsJobs: queueAsPromised<Options>;

// Dump job
const dumpJob: queueAsPromised<util.Queue<EventTransfer>> = fastq.promise(dump, 1);

// Execute query events job
async function queryLogs(opts: Options = {
	eventType: [EventTypeMint],
	fromBlock: DefaultFromBlock
}): Promise<void> {
	log.RequestId().trace("EXEC JOB(%s), QueryLogs(blocks[%d,%d]) running... QueryLogsJobsCount=%d",
		opts.eventType, opts.fromBlock, opts.toBlock, queryLogsJobs.length());

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

	log.RequestId().trace("JOB(%s) FINISHED, QueryLogs(blocks[%d,%d]), QueryLogsJobsCount=%d",
		opts.eventType, opts.fromBlock, opts.toBlock, queryLogsJobs.length());

	return;
}

// Generate query mint events job
async function fetchEvents(opts: Options = {
	eventType: [EventTypeMint],
	fromBlock: DefaultFromBlock,
	maxBlockRange: DefaultMaxBlockRange,
	pushJobIntervals: DefaultPushJobIntervals,
	keepRunning: DefaultKeepRunning,
}): Promise<void> {
	let nextFrom = opts.fromBlock;
	let nextTo = 0;
	let blockRange = opts.maxBlockRange;
	let leftBlocks = 0;
	let blockNumber = opts.toBlock ? opts.toBlock : await core.GetBlockNumber();

	auditor.Check(blockNumber >= nextFrom, "Invalid fromBlock/toBlock");

	// Connect to database
	await DB.Connect();

	do {
		leftBlocks = blockNumber - nextFrom;
		if (leftBlocks <= 0) {
			if (!opts.keepRunning) {
				break;
			}
			await util.time.SleepSeconds(DefaultQueryIntervals);
			blockNumber = await core.GetBlockNumber();
			continue;
		}

		blockRange = leftBlocks < opts.maxBlockRange ? leftBlocks : opts.maxBlockRange;
		nextTo = nextFrom + blockRange;

		if (blockRange >= 0 && blockRange <= 1) {
			log.RequestId().debug("Catch up the latest block(%d)", blockNumber);
		}
		log.RequestId().trace("PUSH JOB, blocks[%d,%d](range=%d), queryLogsJobs=%d", nextFrom, nextTo, blockRange, queryLogsJobs.length());

		queryLogsJobs.push({
			address: opts.address,      // The address to filter by, or null to match any address
			eventType: opts.eventType,  // ERC721 event type: mint/transfer/burn
			fromBlock: nextFrom,        // Fetch from block number
			toBlock: nextTo,            // Fetch to block number
		}).catch((err) => log.RequestId().error(err));

		nextFrom = nextTo + 1;

		await util.time.SleepMilliseconds(opts.pushJobIntervals);
	} while (nextFrom > 0);

	log.RequestId().info("FetchEvents finished, options=%o", opts);

	return;
}

// Run event fetcher
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
	auditor.Check(conf.fetcher.fromBlock >= 0, "Invalid fromBlock");

	queryLogsJobs = fastq.promise(queryLogs, conf.fetcher.executeJobConcurrency ? conf.fetcher.executeJobConcurrency : DefaultExecuteJobConcurrency);

	log.RequestId().info("Event fetcher is running...");

	// Schedule processing job
	setInterval(() => {
		auditor.Check(eventQueue, "Event queue is nil");
		if (eventQueue.Length() === 0) {
			return;
		}

		dumpJob.push(eventQueue).catch((err) => log.RequestId().error(err));
	}, DefaultLoopInterval);

	return;
}

// Event callback
async function callback(evt: EventTransfer): Promise<void> {
	try {
		const conf = customConfig.GetEvents().fetcher;

		// Check URL
		if (!conf.callback) {
			return;
		}

		// Callback
		log.RequestId().debug("Fetcher calling back(%s)... event:", conf.callback, evt);
		const rsp: Response = await got.post(conf.callback, {
			json: evt
		}).json();

		log.RequestId().trace("Fetcher callback response=", rsp);
	} catch (e) {
		log.RequestId().error("Fetcher callback failed, error=", e);
		return;
	}

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

			// Callback (Optional)
			await callback(evt);

			// Dump event to database
			log.RequestId().info("Dumping events to db, count=%d, event=%o", i + 1, evt);
			await DB.Client().Save(evt);
		}
	} catch (e) {
		log.RequestId().error("Dump failed, error=", e);
		return;
	}

	return;
}

// PushFetchEventsJob push FetchEvents job to scheduler
export function PushFetchEventsJob(opts: Options) {
	fetchEventsJobs.push({
		address: opts.address,
		eventType: opts.eventType,
		fromBlock: opts.fromBlock,
		toBlock: opts.toBlock,
		maxBlockRange: opts.maxBlockRange ? opts.maxBlockRange : customConfig.GetEvents().fetcher.maxBlockRange,
		pushJobIntervals: opts.pushJobIntervals ? opts.pushJobIntervals : customConfig.GetEvents().fetcher.pushJobIntervals,
	}).catch((err) => log.RequestId().error(err));
}

// Export handler
export {Handler} from './handler';
