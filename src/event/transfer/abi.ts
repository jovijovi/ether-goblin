import {ethers, utils} from 'ethers';
import {network} from '@jovijovi/ether-network';
import {log} from '@jovijovi/pedrojs-common';
import {Cache} from '../../common/cache';

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

async function getNFTContractOwner(address: string): Promise<string> {
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

export async function GetNFTContractOwner(address: string): Promise<string> {
	try {
		return await getNFTContractOwner(address);
	} catch (e) {
		// Not support proxy contract yet
		log.RequestId().trace("Get owner of NFT contract(%s) failed, reason=%s", address, e.reason);
		return undefined;
	}
}
