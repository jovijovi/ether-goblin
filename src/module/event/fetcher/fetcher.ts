import {utils} from 'ethers';
import {Log} from '@ethersproject/abstract-provider';
import {auditor, log, util} from '@jovijovi/pedrojs-common';
import fastq, {queueAsPromised} from 'fastq';
import {network} from '@jovijovi/ether-network';
import {Options} from './options';
import {
	DefaultExecuteJobConcurrency,
	DefaultFromBlock,
	DefaultKeepRunning,
	DefaultMaxBlockRange,
	DefaultPushJobIntervals,
	DefaultQueryIntervals,
	DefaultRetryTimes,
} from './params';
import {EventTransfer} from '../common/types';
import {customConfig} from '../../../config';
import {DB} from './db';
import {EventMapper, EventNameMapper, EventTypeBurn, EventTypeMint, EventTypeTransfer} from '../common/constants';
import {CheckEventType, CheckTopics, GetEventType, NewJobID} from '../utils';
import {NewProgressBar, UpdateProgressBar} from './progress';
import * as callback from './callback';
import * as dump from './dump';
import {GetBlockNumber, GetBlockTimestamp, RandomRetryInterval} from './common';
import {Cache} from '../../../common/cache';

// Fetch events jobs
const fetchEventsJobs: queueAsPromised<Options> = fastq.promise(fetchEvents, 1);

// Query logs jobs
let queryLogsJobs: queueAsPromised<Options>;

// Run event fetcher
export async function Run() {
	const [conf, ok] = await init();
	if (!ok) {
		return;
	}

	// Schedule dump job
	await dump.Run();

	// Schedule callback job
	if (conf.callback) {
		await callback.Run();
	}

	// Push FetchEvents job
	if (!conf.api) {
		PushJob({
			eventType: conf.eventType,
			fromBlock: conf.fromBlock,
			toBlock: conf.toBlock,
			maxBlockRange: conf.maxBlockRange ? conf.maxBlockRange : DefaultMaxBlockRange,
			pushJobIntervals: conf.pushJobIntervals ? conf.pushJobIntervals : DefaultPushJobIntervals,
			keepRunning: conf.keepRunning,
		});
	}

	log.RequestId().info("Event fetcher is running...");

	return;
}

// Init fetcher
async function init(): Promise<[customConfig.EventFetcherConfig, boolean]> {
	// Load config
	const conf = customConfig.GetEvents();
	if (!conf) {
		log.RequestId().info('No events configuration, skipped.');
		return [undefined, false];
	} else if (!conf.fetcher.enable) {
		log.RequestId().info('Event fetcher disabled.');
		return [undefined, false];
	}

	log.RequestId().info("Event fetcher config=", conf.fetcher);

	// Check params
	auditor.Check(conf.fetcher.executeJobConcurrency >= 1, "Invalid executeJobConcurrency");
	auditor.Check(conf.fetcher.fromBlock >= 0, "Invalid fromBlock");

	// Connect to database
	await DB.Connect();

	// Build query logs job
	queryLogsJobs = fastq.promise(queryLogs, conf.fetcher.executeJobConcurrency ? conf.fetcher.executeJobConcurrency : DefaultExecuteJobConcurrency);

	return [conf.fetcher, true];
}

// Execute query events job
async function queryLogs(opts: Options = {
	eventType: [EventTypeMint, EventTypeTransfer, EventTypeBurn],
	fromBlock: DefaultFromBlock
}): Promise<void> {
	log.RequestId().trace("EXEC JOB(QueryLogs|id:%s), blocks[%d,%d], TotalJobs=%d",
		opts.jobId, opts.fromBlock, opts.toBlock, queryLogsJobs.length());

	// Get fetcher config
	const conf = customConfig.GetEvents().fetcher;

	// Get topic ID (string array)
	const eventFragments = opts.eventType.map(x => EventMapper.get(x));
	const topicIDs = eventFragments.map(x => EventNameMapper.get(x));

	// Build event filter
	const evtFilter = {
		address: opts.address,
		fromBlock: opts.fromBlock,
		toBlock: opts.toBlock,
		topics: [
			topicIDs,
		]
	};

	// Get event logs
	const provider = network.MyProvider.Get();
	const events = await util.retry.Run(async (): Promise<Array<Log>> => {
		return await provider.getLogs(evtFilter);
	}, DefaultRetryTimes, RandomRetryInterval(), false);

	for (const event of events) {
		// Check event topics
		if (!CheckTopics(event.topics)) {
			continue;
		}

		// Check event type
		if (!CheckEventType(event.topics, opts.eventType)) {
			continue;
		}

		// Build event
		const blockTimestamp = await GetBlockTimestamp(event.blockHash);
		const evt: EventTransfer = {
			address: event.address,
			blockNumber: event.blockNumber,
			blockHash: event.blockHash,
			blockTimestamp: blockTimestamp,
			blockDatetime: util.time.GetUnixTimestamp(blockTimestamp, 'UTC'),
			transactionHash: event.transactionHash,
			from: utils.hexZeroPad(utils.hexValue(event.topics[1]), 20),
			to: utils.hexZeroPad(utils.hexValue(event.topics[2]), 20),
			tokenId: Number(utils.hexValue(event.topics[3])),
			eventType: GetEventType(event.topics),
		};

		// Push event to queue
		dump.Push(evt);

		// Push event to callback queue
		if (conf.callback) {
			callback.Push(evt);
		}
	}

	log.RequestId().trace("FINISHED JOB(QueryLogs|id:%s), blocks[%d,%d], TotalJobs=%d",
		opts.jobId, opts.fromBlock, opts.toBlock, queryLogsJobs.length());

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
	let blockNumber = opts.toBlock ? opts.toBlock : await GetBlockNumber();

	auditor.Check(blockNumber >= nextFrom, "Invalid fromBlock/toBlock");

	// Init progress bar
	const totalProgress = blockNumber - nextFrom;
	const progress = NewProgressBar(totalProgress);

	do {
		await util.time.SleepMilliseconds(opts.pushJobIntervals);

		leftBlocks = blockNumber - nextFrom;
		if (leftBlocks <= 0) {
			if (!opts.keepRunning) {
				UpdateProgressBar(progress, totalProgress);
				break;
			}
			await util.time.SleepSeconds(DefaultQueryIntervals);
			blockNumber = await GetBlockNumber();
			continue;
		}

		blockRange = leftBlocks < opts.maxBlockRange ? leftBlocks : opts.maxBlockRange;
		nextTo = nextFrom + blockRange;

		if (blockRange >= 0 && blockRange <= 1) {
			log.RequestId().debug("Catch up the latest block(%d)", blockNumber);
		}

		const jobOpts = {
			jobId: NewJobID(),          // Job ID
			address: opts.address,      // The address to filter by, or null to match any address
			eventType: opts.eventType,  // ERC721 event type: mint/transfer/burn
			fromBlock: nextFrom,        // Fetch from block number
			toBlock: nextTo,            // Fetch to block number
		}
		log.RequestId().trace("PUSH JOB(QueryLogs|id:%s), blocks[%d,%d](range=%d), TotalJobs=%d",
			jobOpts.jobId, nextFrom, nextTo, blockRange, queryLogsJobs.length());
		queryLogsJobs.push(jobOpts).catch((err) => log.RequestId().error(err));

		// Update progress
		UpdateProgressBar(progress, nextTo - nextFrom);

		nextFrom = nextTo + 1;
	} while (nextFrom > 0);

	log.RequestId().info("All JOBs(QueryLogs) are scheduled, options=%o", opts);

	return;
}

// PushJob push FetchEvents job to scheduler
// (Set default config if option is empty)
export function PushJob(opts: Options) {
	fetchEventsJobs.push({
		address: opts.address,
		eventType: opts.eventType ? opts.eventType : customConfig.GetEvents().fetcher.eventType,
		fromBlock: opts.fromBlock ? opts.fromBlock : customConfig.GetEvents().fetcher.fromBlock,
		toBlock: opts.toBlock,
		maxBlockRange: opts.maxBlockRange ? opts.maxBlockRange : customConfig.GetEvents().fetcher.maxBlockRange,
		pushJobIntervals: opts.pushJobIntervals ? opts.pushJobIntervals : customConfig.GetEvents().fetcher.pushJobIntervals,
		keepRunning: opts.keepRunning ? opts.keepRunning : customConfig.GetEvents().fetcher.keepRunning,
	}).catch((err) => log.RequestId().error(err));
}

// Get token history
export async function GetTokenHistory(address: string, tokenId: string): Promise<any> {
	const key = Cache.CombinationKey([address, tokenId]);
	if (Cache.CacheNFTHistory.has(key)) {
		return Cache.CacheNFTHistory.get(key);
	}

	const historyDetails = await DB.Client().QueryTokenHistory(address, tokenId);
	const result = [];
	for (const moment of historyDetails) {
		result.push({
			block_number: moment.block_number,
			transaction_hash: moment.transaction_hash,
			from: moment.from,
			to: moment.to,
			event_type: moment.event_type,
		})
	}
	Cache.CacheNFTHistory.set(key, result);

	return result;
}

// Export handler
export {Handler} from './handler';
