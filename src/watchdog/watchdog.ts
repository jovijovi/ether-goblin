import * as util from 'util';
import got from 'got';
import {BigNumber, utils} from 'ethers';
import fastq, {queueAsPromised} from 'fastq';
import {auditor, log} from '@jovijovi/pedrojs-common';
import {Queue, retry} from '@jovijovi/pedrojs-common/util';
import {network} from '@jovijovi/ether-network';
import {customConfig} from '../config';
import {
	DefaultAlertType,
	DefaultLoopInterval,
	DefaultRetryMaxInterval,
	DefaultRetryMinInterval,
	DefaultRetryTimes
} from './params';
import {IsAlert} from './rules';
import {MailContent, mailer, Template} from '../mailer';
import {AlertGeneratorParams, Balance, CheckAddressBalanceJobParams, FuncAlertGenerator} from './types';
import {GetPastBalance, SetCache} from './cache';
import {GenHtmlMail} from './mail';

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
	// Check params
	auditor.Check(utils.isAddress(opts.watchedAddress.address), 'invalid address');
	auditor.Check(opts.blockNumber >= 0, 'invalid blockNumber');

	// Get previous balance & current balance
	const balance = await getBalance(opts);

	// Check if is alert
	const [isAlert, alertType] = IsAlert(opts.watchedAddress, balance);
	if (!isAlert) {
		return;
	}

	// Generate alert
	const [msg, subject] = alertType === DefaultAlertType.BalanceReachLimit ?
		balanceReachLimitAlert({
			balance: balance,
			blockNumber: opts.blockNumber,
			watchedAddress: opts.watchedAddress
		})()
		: balanceChangesAlert({
			balance: balance,
			blockNumber: opts.blockNumber,
			watchedAddress: opts.watchedAddress,
		})();

	// Send alert
	await sendAlert(Template.BalanceAlertMailContent({
		subject: subject,
		html: GenHtmlMail(alertType, msg),
	}));

	// Callback (optional)
	await callback(msg);
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

// Get previous balance & current balance
async function getBalance(opts: CheckAddressBalanceJobParams): Promise<Balance> {
	// Get previous balance
	let balancePrevious = GetPastBalance(opts.watchedAddress.address, opts.watchedAddress.rule);
	if (!balancePrevious) {
		log.RequestId().trace("Getting previous balance of address(%s)@block(%d)...",
			opts.watchedAddress.address, opts.blockNumber - 1);
		balancePrevious = await retryGetBalance(opts.watchedAddress.address, opts.blockNumber < 1 ? 0 : opts.blockNumber - 1)
		SetCache(opts.watchedAddress.address, opts.watchedAddress.rule, balancePrevious);
	}

	// Get current balance
	log.RequestId().trace("Getting current balance of address(%s)@block(%d)...",
		opts.watchedAddress.address, opts.blockNumber);
	const balanceCurrent = await retryGetBalance(opts.watchedAddress.address, opts.blockNumber);
	if (!balanceCurrent.eq(balancePrevious)) {
		SetCache(opts.watchedAddress.address, opts.watchedAddress.rule, balanceCurrent);
	}

	return {
		Previous: balancePrevious,
		Current: balanceCurrent,
	};
}

// Retry get balance
async function retryGetBalance(address: string, blockNumber: number): Promise<BigNumber> {
	const provider = network.MyProvider.Get();
	return await retry.Run(async (): Promise<BigNumber> => {
		return await provider.getBalance(address, blockNumber);
	}, DefaultRetryTimes, retry.RandomRetryInterval(DefaultRetryMinInterval, DefaultRetryMaxInterval), false);
}

// Function to generate BalanceReachLimit alert
function balanceReachLimitAlert(opts: AlertGeneratorParams): FuncAlertGenerator {
	return (): [any, string] => {
		const alertMsg = util.format("Address(%s) balance (%s) reaches limit (%s) at blockNumber(%d) [Chain:%s Network:%s ChainId:%s]",
			opts.watchedAddress.address, utils.formatEther(opts.balance.Current), utils.formatEther(opts.watchedAddress.limit), opts.blockNumber,
			network.GetDefaultNetwork().chain, network.GetDefaultNetwork().network, network.GetChainId());

		log.RequestId().info("***** ALERT ***** %s", alertMsg);

		const msg = {
			address: opts.watchedAddress.address,
			rule: opts.watchedAddress.rule,
			balanceCurrent: utils.formatEther(opts.balance.Current),
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
	};
}

// Function to generate BalanceChanges alert
function balanceChangesAlert(opts: AlertGeneratorParams): FuncAlertGenerator {
	return (): [any, string] => {
		const alertMsg = util.format("Address(%s) balance changed from (%s) to (%s) at blockNumber(%d) [Chain:%s Network:%s ChainId:%s]",
			opts.watchedAddress.address, utils.formatEther(opts.balance.Previous), utils.formatEther(opts.balance.Current), opts.blockNumber,
			network.GetDefaultNetwork().chain, network.GetDefaultNetwork().network, network.GetChainId());

		log.RequestId().info("***** ALERT ***** %s", alertMsg);

		const changed = opts.balance.Current.sub(opts.balance.Previous);
		const plusSign = changed.gt(BigNumber.from(0)) ? '+' : '';
		const balanceChanged = plusSign + utils.formatEther(opts.balance.Current.sub(opts.balance.Previous));
		const msg = {
			address: opts.watchedAddress.address,
			rule: opts.watchedAddress.rule,
			balanceChanged: balanceChanged,
			balanceCurrent: utils.formatEther(opts.balance.Current),
			balancePrevious: utils.formatEther(opts.balance.Previous),
			addressUrl: util.format("%s/address/%s", network.GetBrowser(), opts.watchedAddress.address),
			blockNumber: opts.blockNumber.toString(),
			chain: network.GetDefaultNetwork().chain,
			network: network.GetDefaultNetwork().network,
			chainId: network.GetChainId(),
		}
		const subject = util.format("%s (%s @%d)", opts.watchedAddress.address, balanceChanged, opts.blockNumber);
		return [msg, subject];
	};
}
