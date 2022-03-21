import {log} from '@jovijovi/pedrojs-common';
import * as network from '../../../network';
import {YaNFT, YaNFT__factory} from '../../../../typechain-types';
import {GetWallet} from '../../../eth/core/common';

// Get contract class
function GetYaNFTContract(address: string, pk?: string): YaNFT {
	if (!pk) {
		return YaNFT__factory.connect(address, network.MyProvider.Get());
	}
	return YaNFT__factory.connect(address, GetWallet(pk));
}

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
