import {ABI} from '../abi';
import {response as MyResponse} from '@jovijovi/pedrojs-network-http/server';
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
