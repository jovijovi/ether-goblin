import {log} from '@jovijovi/pedrojs-common';
import {response as MyResponse} from '@jovijovi/pedrojs-network-http';
import {Core} from '../core';
import {Cache} from '../../common/cache';

// Get gas price
export async function getGasPrice(req, res) {
	try {
		const result = await Core.GetGasPrice();

		res.send(result);

		log.RequestId().info(result);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Get tx receipt
export async function getReceipt(req, res) {
	if (!req.query ||
		!req.query.txHash
	) {
		return MyResponse.BadRequest(res);
	}

	log.RequestId().debug("New request query=", req.query);

	try {
		const receipt = await Core.GetReceipt(req.query.txHash);

		if (!receipt) {
			return MyResponse.NotFound(res);
		}
		res.send(receipt);

		log.RequestId().info("receipt=", receipt);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Get tx
export async function getTxResponse(req, res) {
	if (!req.query ||
		!req.query.txHash
	) {
		return MyResponse.BadRequest(res);
	}

	log.RequestId().debug("New request query=", req.query);

	try {
		const tx = await Core.GetTxResponse(req.query.txHash);

		if (!tx) {
			return MyResponse.NotFound(res);
		}
		res.send(tx);

		log.RequestId().info("tx=", tx);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Get block number
export async function getBlockNumber(req, res) {
	try {
		const blockNumber = await Core.GetBlockNumber();

		res.send({
			"blockNumber": blockNumber,
		});

		log.RequestId().info("blockNumber=", blockNumber);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Get block by hash
export async function getBlock(req, res) {
	if (!req.query ||
		!req.query.blockHash
	) {
		return MyResponse.BadRequest(res);
	}

	try {
		const block = await Core.GetBlock(req.query.blockHash);

		res.send(block);

		log.RequestId().info("block=", block);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Get block number
export async function getBalanceOf(req, res) {
	if (!req.query ||
		!req.query.address
	) {
		return MyResponse.BadRequest(res);
	}

	log.RequestId().debug("New request query=", req.query);

	try {
		const balanceResult = await Core.GetBalanceOf(req.query.address);

		res.send(balanceResult);

		log.RequestId().info("balance(%s)=%o", req.query.address, balanceResult);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Get block number
export async function observer(req, res) {
	if (!req.params ||
		!req.params.address
	) {
		return MyResponse.BadRequest(res);
	}

	try {
		// Set cache ttl to 3 seconds by default
		if (Cache.CacheBalanceObserver.has(req.params.address)) {
			res.send(Cache.CacheBalanceObserver.get(req.params.address));
			return;
		}

		const balanceResult = await Core.Observer(req.params.address);

		res.send(balanceResult);

		Cache.CacheBalanceObserver.set(req.params.address, balanceResult);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Transfer
export async function transfer(req, res) {
	if (!req.body ||
		!req.body.from ||
		!req.body.to ||
		!req.body.amount ||
		!req.body.pk
	) {
		return MyResponse.BadRequest(res);
	}

	log.RequestId().debug("New request body=", req.body);

	try {
		const receipt = await Core.Transfer(req.body.from, req.body.to, req.body.amount, req.body.pk);

		res.send({
			"txHash": receipt.transactionHash,
		});

		log.RequestId().info("txHash=", receipt.transactionHash);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Verify signature
export async function verifySignature(req, res) {
	if (!req.body ||
		!req.body.address ||
		!req.body.msg ||
		!req.body.sig
	) {
		return MyResponse.BadRequest(res);
	}

	log.RequestId().debug("New request url=%o, body=%o", req.url, req.body);

	try {
		// Set cache, ttl: 10min, max items: 1000
		const cache = Cache.MemCache("verifySignature", 1000 * 60 * 10, 1000);

		// Build compose key
		const composeKey = req.body.address + req.body.msg + req.body.sig;
		if (cache.has(composeKey)) {
			const result = cache.get(composeKey);
			res.send({
				"verified": result,
			});
			return;
		}

		const result = await Core.VerifySig(req.body.address, req.body.msg, req.body.sig);

		res.send({
			"verified": result,
		});

		// Update cache
		cache.set(composeKey, result);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// Verify address
export async function verifyAddress(req, res) {
	if (!req.params ||
		!req.params.address
	) {
		return MyResponse.BadRequest(res);
	}

	try {
		// Set cache, ttl: 10min, max items: 1000
		const cache = Cache.MemCache("verifyAddress", 1000 * 60 * 10, 1000);

		// Check cache
		if (cache.has(req.params.address)) {
			const result = cache.get(req.params.address);
			res.send({
				"verified": result,
			});
			return;
		}

		const result = await Core.VerifyAddress(req.params.address);

		res.send({
			"verified": result,
		});

		// Update cache
		cache.set(req.params.address, result);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// New wallet
export async function newWallet(req, res) {
	try {
		const wallet = await Core.NewWallet(req.body.entropy);
		res.send(wallet);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}
