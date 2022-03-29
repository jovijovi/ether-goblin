import {log} from '@jovijovi/pedrojs-common';
import * as network from '../../../network';
import {GetYaNFTContract} from './common';

// GetTotalSupply returns NFT contract total supply
export async function GetTotalSupply(address: string): Promise<any> {
	const provider = network.MyProvider.Get();
	const blockNumber = await provider.getBlockNumber();

	const contract = GetYaNFTContract(address);
	const totalSupply = await contract.totalSupply();

	log.RequestId().debug("BlockNumber=%s, address=%s, totalSupply=%s", blockNumber.toString(), address, totalSupply.toString());
	return {
		blockNumber: blockNumber,
		address: address,
		totalSupply: totalSupply.toString(),
	}
}
