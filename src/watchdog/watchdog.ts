import {auditor, log} from '@jovijovi/pedrojs-common';
import {BigNumber, utils} from 'ethers';
import * as util from 'util';
import fastq, {queueAsPromised} from 'fastq';
import got from 'got';
import {Queue, retry} from '@jovijovi/pedrojs-common/util';
import fs from 'fs';
import {MailContent} from '../mailer/mailer';
import {IsAlert} from './rules';
import {customConfig} from '../config';
import {mailer, Template} from '../mailer';
import {network} from '@jovijovi/ether-network';
import {DefaultAlertMailTemplate, DefaultAlertType, DefaultLoopInterval} from './params';
import {BalanceCache} from './types';

const blockQueue = new Queue<number>();     // Block queue (ASC, FIFO)
const checkBalanceJob: queueAsPromised<number> = fastq.promise(checkAddressList, 1);    // Job: Check balance
const balanceCacheMaxLimit = 1;             // Balance cache max limit
const balanceCache: BalanceCache<any> = {}; // Balance cache

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

	setInterval(() => {
		if (blockQueue.Length() === 0) {
			return;
		}

		const blockNumber = blockQueue.Shift();
		if (!blockNumber) {
			return;
		}

		checkBalanceJob.push(blockNumber).catch((err) => log.RequestId().error(err));
	}, DefaultLoopInterval);
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

// Combination cache key
function combinationCacheKey(keys: string[]): string {
	return keys.toString();
}

// Set cache
function setCache(address: string, rule: string, balance: BigNumber) {
	const key = combinationCacheKey([address, rule]);
	if (!balanceCache[key]) {
		balanceCache[key] = new Queue(balanceCacheMaxLimit);
	}

	balanceCache[key].Push(balance);
}

// Get past balance from cache
function getPastBalance(address: string, rule: string): BigNumber {
	const key = combinationCacheKey([address, rule]);
	if (!balanceCache[key]) {
		balanceCache[key] = new Queue(balanceCacheMaxLimit);
	}

	return balanceCache[key].First();
}

async function checkAddressBalance(watchedAddress: customConfig.WatchedAddress, blockNumber: number) {
	auditor.Check(utils.isAddress(watchedAddress.address), 'invalid address');
	auditor.Check(blockNumber >= 0, 'invalid blockNumber');

	const provider = network.MyProvider.Get();

	let balancePast = getPastBalance(watchedAddress.address, watchedAddress.rule);
	if (!balancePast) {
		balancePast = await retry.Run(async (): Promise<BigNumber> => {
			return await provider.getBalance(watchedAddress.address, blockNumber < 1 ? 0 : blockNumber - 1);
		});
		setCache(watchedAddress.address, watchedAddress.rule, balancePast);
	}

	const balanceNow = await retry.Run(async (): Promise<BigNumber> => {
		return await provider.getBalance(watchedAddress.address, blockNumber);
	});
	if (!balanceNow.eq(balancePast)) {
		setCache(watchedAddress.address, watchedAddress.rule, balanceNow);
	}

	const [isAlert, alertType] = IsAlert(watchedAddress, {
		Now: balanceNow,
		Past: balancePast,
	});
	if (isAlert) {
		// Function to generate BalanceReachLimit alert
		const genBalanceReachLimitAlert = (): [any, string] => {
			const alertMsg = util.format("Address(%s) balance (%s) reaches limit (%s) at blockNumber(%d) [Chain:%s Network:%s ChainId:%s]",
				watchedAddress.address, utils.formatEther(balanceNow), utils.formatEther(watchedAddress.limit), blockNumber,
				network.GetDefaultNetwork().chain, network.GetDefaultNetwork().network, network.GetChainId());

			log.RequestId().info("***** ALERT ***** %s", alertMsg);

			const msg = {
				address: watchedAddress.address,
				rule: watchedAddress.rule,
				balanceNow: utils.formatEther(balanceNow),
				limit: utils.formatEther(watchedAddress.limit),
				addressUrl: util.format("%s/address/%s", network.GetBrowser(), watchedAddress.address),
				blockNumber: blockNumber.toString(),
				chain: network.GetDefaultNetwork().chain,
				network: network.GetDefaultNetwork().network,
				chainId: network.GetChainId(),
			}
			const subject = util.format("%s reaches limit (%s) @%d", watchedAddress.address, utils.formatEther(watchedAddress.limit), blockNumber);
			return [msg, subject];
		}

		// Function to generate BalanceChanges alert
		const genBalanceChangesAlert = (): [any, string] => {
			const alertMsg = util.format("Address(%s) balance changed from (%s) to (%s) at blockNumber(%d) [Chain:%s Network:%s ChainId:%s]",
				watchedAddress.address, utils.formatEther(balancePast), utils.formatEther(balanceNow), blockNumber,
				network.GetDefaultNetwork().chain, network.GetDefaultNetwork().network, network.GetChainId());

			log.RequestId().info("***** ALERT ***** %s", alertMsg);

			const changed = balanceNow.sub(balancePast);
			const plusSign = changed.gt(BigNumber.from(0)) ? '+' : '';
			const balanceChanged = plusSign + utils.formatEther(balanceNow.sub(balancePast));
			const msg = {
				address: watchedAddress.address,
				rule: watchedAddress.rule,
				balanceChanged: balanceChanged,
				balanceNow: utils.formatEther(balanceNow),
				balancePast: utils.formatEther(balancePast),
				addressUrl: util.format("%s/address/%s", network.GetBrowser(), watchedAddress.address),
				blockNumber: blockNumber.toString(),
				chain: network.GetDefaultNetwork().chain,
				network: network.GetDefaultNetwork().network,
				chainId: network.GetChainId(),
			}
			const subject = util.format("%s (%s @%d)", watchedAddress.address, balanceChanged, blockNumber);
			return [msg, subject];
		}

		// Generate alert
		const [msg, subject] = alertType === DefaultAlertType.BalanceReachLimit ? genBalanceReachLimitAlert() : genBalanceChangesAlert();

		// Send alert
		await sendAlert(Template.BalanceAlertMailContent({
			subject: subject,
			html: genHtmlMail(alertType, msg),
		}));

		// Callback (optional)
		await callback(msg);
	}
}

function genHtmlMail(alertType: DefaultAlertType, arg: any): string {
	let template = '';

	switch (alertType) {
		case DefaultAlertType.BalanceReachLimit:
			template = fs.readFileSync(DefaultAlertMailTemplate.BalanceReachLimit.Path, 'utf8');
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

		case DefaultAlertType.BalanceChanges:
			template = fs.readFileSync(DefaultAlertMailTemplate.BalanceChanges.Path, 'utf8');
			template = template.replace(/\${address}/gi, arg.address);
			template = template.replace(/\${rule}/gi, arg.rule);
			template = template.replace(/\${balanceNow}/gi, arg.balanceNow);
			template = template.replace(/\${balancePast}/gi, arg.balancePast);
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

// sendAlert send alert by mail
async function sendAlert(mailContent: MailContent) {
	try {
		if (!customConfig.GetWatchdog().mailer) {
			return;
		}

		await mailer.Send(customConfig.GetWatchdog().mailer, mailContent);
	} catch (e) {
		log.RequestId().error("SendAlert failed, error=", e);
	}
}

// callback
async function callback(msg: any) {
	try {
		const callback = customConfig.GetWatchdog().callback;
		if (!callback || !msg) {
			return;
		}

		// Send a POST request with JSON body
		const rsp = await got.post(callback, {
			json: msg
		}).json();
		log.RequestId().trace("Callback response=", rsp);
	} catch (e) {
		log.RequestId().error("Callback failed, error=", e);
	}
}
