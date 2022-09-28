import fs from 'fs';
import * as util from 'util';
import got from 'got';
import {BigNumber, utils} from 'ethers';
import fastq, {queueAsPromised} from 'fastq';
import {auditor, log} from '@jovijovi/pedrojs-common';
import {Queue, retry} from '@jovijovi/pedrojs-common/util';
import {network} from '@jovijovi/ether-network';
import {customConfig} from '../config';
import {DefaultAlertMailTemplate, DefaultAlertType, DefaultLoopInterval} from './params';
import {IsAlert} from './rules';
import {MailContent, mailer, Template} from '../mailer';
import {CheckAddressBalanceJobParams} from './types';
import {GetPastBalance, SetCache} from './cache';

// Block queue (ASC, FIFO)
const blockQueue = new Queue<number>();

// Job: Check address list
const checkAddressListJob: queueAsPromised<number> = fastq.promise(checkAddressList, 1);

// Job scheduler: Check address balance
const checkAddressBalanceJobScheduler: Map<string, queueAsPromised<CheckAddressBalanceJobParams>> = new Map();

// Run watchdog
export function Run() {
	const [conf, ok] = init();
	if (!ok) {
		return;
	}

	// Listen block event
	const provider = network.MyProvider.Get();
	let nextBlock = 0;
	provider.on('block', (blockNumber) => {
		if (blockNumber >= nextBlock) {
			blockQueue.Push(blockNumber);
			nextBlock = blockNumber + conf.period;
		}
	})

	// Schedule processing job
	setInterval(() => {
		if (blockQueue.Length() === 0) {
			return;
		}

		const blockNumber = blockQueue.Shift();
		if (!blockNumber) {
			return;
		}

		checkAddressListJob.push(blockNumber).catch((err) => log.RequestId().error(err));
	}, DefaultLoopInterval);

	log.RequestId().info("Watchdog is running...");
}

// Init watchdog
function init(): [customConfig.WatchdogConfig, boolean] {
	// Check config
	const conf = customConfig.GetWatchdog();
	if (!conf) {
		log.RequestId().info('No watchdog configuration, skipped.');
		return;
	} else if (!conf.enable) {
		log.RequestId().info('Watchdog disabled.');
		return;
	}

	// Check address list
	if (!conf.addressList) {
		throw new Error(`invalid addressList`);
	}
	for (const watchedAddress of conf.addressList) {
		auditor.Check(utils.isAddress(watchedAddress.address), 'invalid address');
	}

	return [conf, true];
}

// Check address list
async function checkAddressList(blockNumber: number): Promise<void> {
	auditor.Check(blockNumber >= 0, 'invalid blockNumber');

	// Get address list
	const addressList = customConfig.GetWatchdog().addressList;
	if (!addressList) {
		return;
	}

	// Check address list
	for (let i = 0; i < addressList.length; i++) {
		try {
			const address = addressList[i].address;
			auditor.Check(utils.isAddress(address), 'invalid address');

			if (!checkAddressBalanceJobScheduler.has(address)) {
				checkAddressBalanceJobScheduler.set(address, fastq.promise(checkAddressBalance, 1));
			}

			checkAddressBalanceJobScheduler.get(address).push({
				watchedAddress: addressList[i],
				blockNumber: blockNumber,
			}).catch((err) => log.RequestId().error(err));
		} catch (e) {
			log.RequestId().error("Check balance of address(%s)@block(%d) failed, error=%o",
				addressList[i], blockNumber, e);
		}
	}
}

// Check address balance
async function checkAddressBalance(opts: CheckAddressBalanceJobParams) {
	auditor.Check(utils.isAddress(opts.watchedAddress.address), 'invalid address');
	auditor.Check(opts.blockNumber >= 0, 'invalid blockNumber');

	const provider = network.MyProvider.Get();

	// Get previous balance
	let balancePrevious = GetPastBalance(opts.watchedAddress.address, opts.watchedAddress.rule);
	if (!balancePrevious) {
		balancePrevious = await retry.Run(async (): Promise<BigNumber> => {
			log.RequestId().debug("Getting previous balance of address(%s)@block(%d)...",
				opts.watchedAddress.address, opts.blockNumber - 1);
			return await provider.getBalance(opts.watchedAddress.address, opts.blockNumber < 1 ? 0 : opts.blockNumber - 1);
		});
		SetCache(opts.watchedAddress.address, opts.watchedAddress.rule, balancePrevious);
	}

	// Get current balance
	const balanceCurrent = await retry.Run(async (): Promise<BigNumber> => {
		log.RequestId().debug("Getting current balance of address(%s)@block(%d)...",
			opts.watchedAddress.address, opts.blockNumber);
		return await provider.getBalance(opts.watchedAddress.address, opts.blockNumber);
	});
	if (!balanceCurrent.eq(balancePrevious)) {
		SetCache(opts.watchedAddress.address, opts.watchedAddress.rule, balanceCurrent);
	}

	// Check if is alert
	const [isAlert, alertType] = IsAlert(opts.watchedAddress, {
		Current: balanceCurrent,
		Previous: balancePrevious,
	});
	if (isAlert) {
		// Function to generate BalanceReachLimit alert
		const genBalanceReachLimitAlert = (): [any, string] => {
			const alertMsg = util.format("Address(%s) balance (%s) reaches limit (%s) at blockNumber(%d) [Chain:%s Network:%s ChainId:%s]",
				opts.watchedAddress.address, utils.formatEther(balanceCurrent), utils.formatEther(opts.watchedAddress.limit), opts.blockNumber,
				network.GetDefaultNetwork().chain, network.GetDefaultNetwork().network, network.GetChainId());

			log.RequestId().info("***** ALERT ***** %s", alertMsg);

			const msg = {
				address: opts.watchedAddress.address,
				rule: opts.watchedAddress.rule,
				balanceCurrent: utils.formatEther(balanceCurrent),
				limit: utils.formatEther(opts.watchedAddress.limit),
				addressUrl: util.format("%s/address/%s", network.GetBrowser(), opts.watchedAddress.address),
				blockNumber: opts.blockNumber.toString(),
				chain: network.GetDefaultNetwork().chain,
				network: network.GetDefaultNetwork().network,
				chainId: network.GetChainId(),
			}
			const subject = util.format("%s reaches limit (%s) @%d",
				opts.watchedAddress.address, utils.formatEther(opts.watchedAddress.limit), opts.blockNumber);
			return [msg, subject];
		}

		// Function to generate BalanceChanges alert
		const genBalanceChangesAlert = (): [any, string] => {
			const alertMsg = util.format("Address(%s) balance changed from (%s) to (%s) at blockNumber(%d) [Chain:%s Network:%s ChainId:%s]",
				opts.watchedAddress.address, utils.formatEther(balancePrevious), utils.formatEther(balanceCurrent), opts.blockNumber,
				network.GetDefaultNetwork().chain, network.GetDefaultNetwork().network, network.GetChainId());

			log.RequestId().info("***** ALERT ***** %s", alertMsg);

			const changed = balanceCurrent.sub(balancePrevious);
			const plusSign = changed.gt(BigNumber.from(0)) ? '+' : '';
			const balanceChanged = plusSign + utils.formatEther(balanceCurrent.sub(balancePrevious));
			const msg = {
				address: opts.watchedAddress.address,
				rule: opts.watchedAddress.rule,
				balanceChanged: balanceChanged,
				balanceCurrent: utils.formatEther(balanceCurrent),
				balancePrevious: utils.formatEther(balancePrevious),
				addressUrl: util.format("%s/address/%s", network.GetBrowser(), opts.watchedAddress.address),
				blockNumber: opts.blockNumber.toString(),
				chain: network.GetDefaultNetwork().chain,
				network: network.GetDefaultNetwork().network,
				chainId: network.GetChainId(),
			}
			const subject = util.format("%s (%s @%d)", opts.watchedAddress.address, balanceChanged, opts.blockNumber);
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
