import {ethers, utils} from 'ethers';
import {network} from '@jovijovi/ether-network';
import {log, util} from '@jovijovi/pedrojs-common';
import {core} from '@jovijovi/ether-core';
import {Cache} from '../../common/cache';
import {DefaultRetryMaxInterval, DefaultRetryMinInterval, DefaultRetryTimes} from './params';

const owner = `
[
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
]
`

export const enum ABI {
	owner = 'owner',
}

// ABI Mapper
export const ABIMapper = new Map([
	[ABI.owner, owner],
]);

async function getContractOwner(address: string): Promise<string> {
	const key = Cache.CombinationKey([address])

	// Get cache
	if (Cache.CacheContractOwner.has(key)) {
		return Cache.CacheContractOwner.get(key);
	}

	const provider = network.MyProvider.Get();
	const contractInterface = new utils.Interface(ABIMapper.get(ABI.owner));
	const contract = new ethers.Contract(address, contractInterface, provider);
	const owner = await contract.owner();

	// Set cache
	Cache.CacheContractOwner.set(key, owner);

	return owner;
}

// GetContractOwner returns contract owner
export async function GetContractOwner(address: string): Promise<string> {
	try {
		return await util.retry.Run(async (): Promise<string> => {
			// Get cache
			if (Cache.CacheContractOwner.has(address)) {
				return Cache.CacheContractOwner.get(address);
			}

			if (await core.IsProxyContract(address)) {
				// Not support proxy contract yet
				log.RequestId().trace("Ignore proxy contract(%s), skipped", address);
				return undefined;
			}

			return await getContractOwner(address);
		}, DefaultRetryTimes, util.retry.RandomRetryInterval(DefaultRetryMinInterval, DefaultRetryMaxInterval), false);
	} catch (e) {
		Cache.CacheContractOwner.set(address, undefined);
		log.RequestId().warn("GetContractOwner(%s) failed, reason=%s", address, e.reason);
	}

	return undefined;
}
