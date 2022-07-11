import {ethers, utils} from 'ethers';
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

export async function GetNFTContractOwner(address: string): Promise<string> {
	const key = Cache.CombinationKey([address])

	// Get cache
	if (Cache.CacheContractOwner.has(key)) {
		return Cache.CacheContractOwner.get(key);
	}

	const contractInterface = new utils.Interface(ownerABI);
	const contract = new ethers.Contract(address, contractInterface);
	const owner = await contract.owner();

	// Set cache
	Cache.CacheContractOwner.set(key, owner);

	return owner;
}
