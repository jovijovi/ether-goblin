import got from 'got';
import fastq, {queueAsPromised} from 'fastq';
import {auditor, log, util} from '@jovijovi/pedrojs-common';
import {customConfig} from '../../../config';
import {EventTransfer, Response} from '../common/types';
import {RandomRetryInterval} from './common';
import {DefaultLoopInterval, DefaultRetryTimes} from './params';

// Callback queue (ASC, FIFO)
const callbackQueue = new util.Queue<EventTransfer>();

// Callback job
const callbackJob: queueAsPromised<util.Queue<EventTransfer>> = fastq.promise(callback, 1);

// Schedule callback job
export async function Run() {
	let isEmpty = true;
	setInterval(() => {
		auditor.Check(callbackQueue, "Callback queue is nil");
		if (callbackQueue.Length() === 0) {
			if (!isEmpty) {
				log.RequestId().info("All callback finished, queue is empty");
				isEmpty = true;
			}
			return;
		}

		callbackJob.push(callbackQueue).catch((err) => log.RequestId().error(err));
		isEmpty = false;
	}, DefaultLoopInterval);
}

// Push event to callback queue
export function Push(evt: EventTransfer) {
	callbackQueue.Push(evt);
}

// Event callback
async function callback(queue: util.Queue<EventTransfer>): Promise<void> {
	const conf = customConfig.GetEvents().fetcher;

	// Check URL
	if (!conf.callback) {
		return;
	}

	const len = queue.Length();
	if (len === 0) {
		return;
	}

	for (let i = 0; i < len; i++) {
		const evt = queue.Shift();

		// Callback
		log.RequestId().debug("Fetcher calling back(%s)... event=%o", conf.callback, evt);
		try {
			const rsp: Response = await util.retry.Run(async (): Promise<Response> => {
				return got.post(conf.callback, {
					json: evt
				}).json();
			}, DefaultRetryTimes, RandomRetryInterval(), false);

			log.RequestId().trace("Fetcher callback response=%o", rsp);
		} catch (e) {
			log.RequestId().error("Fetcher callback failed, error=%o", e.message);
		}
	}

	return;
}
