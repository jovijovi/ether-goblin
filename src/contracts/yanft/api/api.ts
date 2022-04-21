import {ABI} from '../abi';
import {response as MyResponse} from '@jovijovi/pedrojs-network-http/server';
import {log} from '@jovijovi/pedrojs-common';
import {Cache} from '../../../common/cache';

// Get total supply
export async function getGetTotalSupply(req, res) {
	if (!req.params ||
		!req.params.address
	) {
		return MyResponse.BadRequest(res);
	}

	try {
		// Set cache ttl to 3 seconds by default
		if (Cache.CacheTotalSupplyOfNFT.has(req.params.address)) {
			res.send(Cache.CacheTotalSupplyOfNFT.get(req.params.address));
			return;
		}

		const result = await ABI.GetTotalSupply(req.params.address);

		res.send(result);

		Cache.CacheTotalSupplyOfNFT.set(req.params.address, result);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}

// EstimateGasOfTransferNFT returns estimateGas of transfer NFT tx
export async function estimateGasOfTransferNFT(req, res) {
	if (!req.body ||
		!req.body.address ||
		!req.body.from ||
		!req.body.to ||
		!req.body.tokenId
	) {
		return MyResponse.BadRequest(res);
	}

	try {
		const key = Cache.CombinationKey([req.body.address, req.body.from, req.body.to, req.body.tokenId])
		// Set cache
		if (Cache.CacheEstimateGasOfTransferNFT.has(key)) {
			res.send(Cache.CacheEstimateGasOfTransferNFT.get(key));
			return;
		}

		const result = {
			gasFee: await ABI.EstimateGasOfTransferNFT(req.body.address, req.body.from, req.body.to, req.body.tokenId)
		};
		res.send(result);

		Cache.CacheEstimateGasOfTransferNFT.set(key, result);

		log.RequestId().info("Estimate transfer NFT tx(%o) gasFee=%s", req.body, result.gasFee);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}
