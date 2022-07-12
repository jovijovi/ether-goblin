import {ethers, utils} from 'ethers';
import {network} from '@jovijovi/ether-network';
import {log} from '@jovijovi/pedrojs-common';
import {Cache} from '../../common/cache';

const ownerABI = `
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

async function getNFTContractOwner(address: string): Promise<string> {
	const key = Cache.CombinationKey([address])

	// Get cache
	if (Cache.CacheContractOwner.has(key)) {
		return Cache.CacheContractOwner.get(key);
	}

	const provider = network.MyProvider.Get();
	const contractInterface = new utils.Interface(ownerABI);
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
