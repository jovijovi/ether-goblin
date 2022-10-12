import got from 'got';
import fastq, {queueAsPromised} from 'fastq';
import {auditor, log, util} from '@jovijovi/pedrojs-common';
import {customConfig} from '../../../config';
import {EventTransfer, Response} from '../common/types';
import {DefaultLoopInterval} from './params';

// Callback queue (ASC, FIFO)
const callbackQueue = new util.Queue<EventTransfer>();

// Callback job
const callbackJob: queueAsPromised<util.Queue<EventTransfer>> = fastq.promise(callback, 1);

// Schedule processing job
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

// Event callback
async function callback(queue: util.Queue<EventTransfer>): Promise<void> {
	try {
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
			log.RequestId().debug("Fetcher calling back(%s)... event:", conf.callback, evt);
			const rsp: Response = await got.post(conf.callback, {
				json: evt
			}).json();

			log.RequestId().trace("Fetcher callback response=", rsp);
		}
	} catch (e) {
		log.RequestId().error("Fetcher callback failed, error=", e);
	}

	return;
}
