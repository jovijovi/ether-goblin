import {ethers, utils} from 'ethers';
import {network} from '@jovijovi/ether-network';
import {log, util} from '@jovijovi/pedrojs-common';
import {core} from '@jovijovi/ether-core';
import {Cache} from '../../common/cache';
import {ErrorCodeCallException, ErrorReasonMissingRevertData} from '../common/errors';
import {DefaultRetryInterval, DefaultRetryTimes} from './params';

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

export async function GetContractOwner(address: string): Promise<string> {
	return await util.retry.Run(async (): Promise<string> => {
		try {
			if (await core.IsProxyContract(address)) {
				// Not support proxy contract yet
				log.RequestId().trace("Ignore proxy contract(%s), skipped", address);
				return undefined;
			}
			return await getContractOwner(address);
		} catch (e) {
			// Get cache
			if (Cache.CacheContractOwner.has(address)) {
				return Cache.CacheContractOwner.get(address);
			}

			// Set cache value 'undefined' if call contract failed
			if (e.reason && e.reason.includes(ErrorReasonMissingRevertData) && e.code === ErrorCodeCallException) {
				Cache.CacheContractOwner.set(address, undefined);
				log.RequestId().trace("GetContractOwner(%s) failed, cacheSize=%d, reason=%s",
					address, Cache.CacheContractOwner.size, e.reason);
				return undefined;
			}

			// Throw other errors
			log.RequestId().error("GetContractOwner(%s) failed, reason=%s", address, e.reason);
			throw e;
		}
	}, DefaultRetryTimes, DefaultRetryInterval);
}
