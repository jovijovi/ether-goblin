import fs from 'fs';
import fastq, {queueAsPromised} from 'fastq';
import {log} from '@jovijovi/pedrojs-common';
import {customConfig} from '../../config';
import {
	DefaultAlertMailTemplate,
	DefaultAlertType,
	DefaultCheckMailQueueInterval,
	DefaultSendAlertMailJobConcurrency
} from './params';
import {Mailer, MailQueue} from '../mailer';

// Job: Send alert mail
const sendAlertMailJob: queueAsPromised<MailQueue> = fastq.promise(sendAlertMail, DefaultSendAlertMailJobConcurrency);

// Alert mailer instance
const alertMailer = new Mailer();

// Initialize alert mailer
export function InitAlertMailer() {
	alertMailer.Init(customConfig.GetWatchdog().mailer);

	// Schedule processing job
	setInterval(() => {
		if (!customConfig.GetWatchdog().mailer || alertMailer.Queue().Length() === 0) {
			return;
		}

		sendAlertMailJob.push(alertMailer.Queue()).catch((err) => log.RequestId().error(err));
	}, DefaultCheckMailQueueInterval);
}

// AlertMailer returns alert mailer
export function AlertMailer(): Mailer {
	return alertMailer;
}

// Send alert mail
async function sendAlertMail(queue: MailQueue) {
	try {
		const length = queue.Length();
		if (length === 0) {
			return;
		}

		log.RequestId().debug("MailQueueLength=%d", length);

		// Send mail
		for (let i = 0; i < length; i++) {
			await alertMailer.Send(queue.Shift());
		}
	} catch (e) {
		log.RequestId().error("SendAlertMail failed, error=", e);
	}
}

// Generate mail in HTML format
export function GenHtmlMail(alertType: DefaultAlertType, arg: any): string {
	let template = '';

	switch (alertType) {
		case DefaultAlertType.BalanceReachLimit:
			template = fs.readFileSync(DefaultAlertMailTemplate.BalanceReachLimit.Path, 'utf8');
			template = template.replace(/\${address}/gi, arg.address);
			template = template.replace(/\${rule}/gi, arg.rule);
			template = template.replace(/\${balanceCurrent}/gi, arg.balanceCurrent);
			template = template.replace(/\${limit}/gi, arg.limit);
			template = template.replace(/\${addressUrl}/gi, arg.addressUrl);
			template = template.replace(/\${blockNumber}/gi, arg.blockNumber);
			template = template.replace(/\${chain}/gi, arg.chain);
			template = template.replace(/\${network}/gi, arg.network);
			template = template.replace(/\${chainId}/gi, arg.chainId);
			return template;

		case DefaultAlertType.BalanceChanges:
			template = fs.readFileSync(DefaultAlertMailTemplate.BalanceChanges.Path, 'utf8');
			template = template.replace(/\${address}/gi, arg.address);
			template = template.replace(/\${rule}/gi, arg.rule);
			template = template.replace(/\${balanceCurrent}/gi, arg.balanceCurrent);
			template = template.replace(/\${balancePrevious}/gi, arg.balancePrevious);
			template = template.replace(/\${balanceChanged}/gi, arg.balanceChanged);
			template = template.replace(/\${addressUrl}/gi, arg.addressUrl);
			template = template.replace(/\${blockNumber}/gi, arg.blockNumber);
			template = template.replace(/\${chain}/gi, arg.chain);
			template = template.replace(/\${network}/gi, arg.network);
			template = template.replace(/\${chainId}/gi, arg.chainId);
			return template;
	}

	return undefined;
}
