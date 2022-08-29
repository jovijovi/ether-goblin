import {ethers, utils} from 'ethers';
import {network} from '@jovijovi/ether-network';
import {log, util} from '@jovijovi/pedrojs-common';
import {Cache} from '../../common/cache';
import {DefaultRetryMaxInterval, DefaultRetryMinInterval, DefaultRetryTimes} from './params';
import {ErrorCodeCallException, ErrorReasonMissingRevertData} from '../common/errors';

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
			try {
				return await getContractOwner(address);
			} catch (e) {
				// Get cache
				if (Cache.CacheContractOwner.has(address)) {
					return Cache.CacheContractOwner.get(address);
				}

				// Set cache value 'undefined' if call contract failed and response is ErrorReasonMissingRevertData
				if (e.reason && e.reason.includes(ErrorReasonMissingRevertData) && e.code === ErrorCodeCallException) {
					Cache.CacheContractOwner.set(address, undefined);
					log.RequestId().trace("GetContractOwner(%s) failed, reason=%s", address, e.reason);
					return undefined;
				}
				throw e;
			}
		}, DefaultRetryTimes, util.retry.RandomRetryInterval(DefaultRetryMinInterval, DefaultRetryMaxInterval), false);
	} catch (e) {
		// Set contract owner to 'undefined' if retry failed
		Cache.CacheContractOwner.set(address, undefined);
		log.RequestId().warn("GetContractOwner(%s) failed, reason=%s", address, e.reason);
	}

	return undefined;
}
