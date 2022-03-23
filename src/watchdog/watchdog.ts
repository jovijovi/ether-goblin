import {auditor, log} from '@jovijovi/pedrojs-common';
import {BigNumber, utils} from 'ethers';
import * as util from 'util';
import fastq, {queueAsPromised} from 'fastq';
import {Queue, retry} from '@jovijovi/pedrojs-common/util';
import fs from 'fs';
import {MailContent} from '../mailer/mailer';
import {IsAlert} from './rules';
import {customConfig} from '../config';
import {mailer, Template} from '../mailer';
import * as network from '../network';
import cron = require('node-schedule');

const blockQueue = new Queue<number>();     // Block queue (ASC, FIFO)
const checkBalanceJob: queueAsPromised<number> = fastq.promise(checkAddressList, 1);    // Job: Check balance

export function Run() {
	// Check config
	const watchdogConf = customConfig.GetWatchdog();
	if (!watchdogConf) {
		log.RequestId().info('No watchdog configuration, skipped.');
		return;
	} else if (!watchdogConf.enable) {
		log.RequestId().info('Watchdog disabled.');
		return;
	}

	log.RequestId().info("Watchdog is running...");

	const provider = network.MyProvider.Get();
	let nextBlock = 0;
	provider.on('block', (blockNumber) => {
		if (blockNumber >= nextBlock) {
			blockQueue.Push(blockNumber);
			nextBlock = blockNumber + watchdogConf.period;
		}
	})

	cron.scheduleJob('*/3 * * * * *', function () {
		if (blockQueue.Length() == 0) {
			return;
		}

		const blockNumber = blockQueue.Shift();
		if (!blockNumber) {
			return;
		}

		checkBalanceJob.push(blockNumber).catch((err) => log.RequestId().error(err));
	});
}

async function checkAddressList(blockNumber: number): Promise<void> {
	auditor.Check(blockNumber >= 0, 'invalid blockNumber');
	// log.RequestId().debug("# Check # BlockNumber: ", blockNumber);

	// Get address list
	const addressList = customConfig.GetWatchdog().addressList;
	if (!addressList) {
		return;
	}

	// Check address list
	for (let i = 0; i < addressList.length; i++) {
		try {
			await checkAddressBalance(addressList[i], blockNumber);
		} catch (e) {
			log.RequestId().error("Check address balance(%s) failed, blockNumber=%d, error=%o", addressList[i], blockNumber, e);
		}
	}
}

async function checkAddressBalance(watchedAddress: customConfig.WatchedAddress, blockNumber: number) {
	auditor.Check(utils.isAddress(watchedAddress.address), 'invalid address');
	auditor.Check(blockNumber >= 0, 'invalid blockNumber');

	const provider = network.MyProvider.Get();

	const balanceNow = await retry.Run(async (): Promise<BigNumber> => {
		return await provider.getBalance(watchedAddress.address, blockNumber);
	});

	if (IsAlert(watchedAddress, balanceNow)) {
		const alertMsg = util.format("Address(%s) balance (%s) reaches limit (%s) at blockNumber(%d) [Chain:%s Network:%s ChainId:%s]",
			watchedAddress.address, utils.formatEther(balanceNow), utils.formatEther(watchedAddress.limit), blockNumber,
			customConfig.GetDefaultNetwork().chain, customConfig.GetDefaultNetwork().network, customConfig.GetChainId());

		log.RequestId().info("***** ALERT ***** %s", alertMsg);

		// Send alert
		await sendAlert(Template.BalanceAlertMailContent({
			subject: util.format("%s reaches limit (%s) @%d", watchedAddress.address, utils.formatEther(watchedAddress.limit), blockNumber),
			html: genHtmlMail({
				address: watchedAddress.address,
				rule: watchedAddress.rule,
				balanceNow: utils.formatEther(balanceNow),
				limit: utils.formatEther(watchedAddress.limit),
				addressUrl: util.format("%s/address/%s", customConfig.GetBrowser(), watchedAddress.address),
				blockNumber: blockNumber.toString(),
				chain: customConfig.GetDefaultNetwork().chain,
				network: customConfig.GetDefaultNetwork().network,
				chainId: customConfig.GetChainId(),
			}),
		}));
	}
}

function genHtmlMail(arg: any): string {
	let template = fs.readFileSync('./template/balance_alert.html', 'utf8');
	template = template.replace(/\${address}/gi, arg.address);
	template = template.replace(/\${rule}/gi, arg.rule);
	template = template.replace(/\${balanceNow}/gi, arg.balanceNow);
	template = template.replace(/\${limit}/gi, arg.limit);
	template = template.replace(/\${addressUrl}/gi, arg.addressUrl);
	template = template.replace(/\${blockNumber}/gi, arg.blockNumber);
	template = template.replace(/\${chain}/gi, arg.chain);
	template = template.replace(/\${network}/gi, arg.network);
	template = template.replace(/\${chainId}/gi, arg.chainId);
	return template;
}

// sendAlert send alert by mail
async function sendAlert(mailContent: MailContent) {
	if (!customConfig.GetWatchdog().mailer) {
		return;
	}

	await mailer.Send(customConfig.GetWatchdog().mailer, mailContent);
}
