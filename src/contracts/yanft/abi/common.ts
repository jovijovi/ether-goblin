import {YaNFT, YaNFT__factory} from '../../../../typechain-types';
import {network} from '@jovijovi/ether-network';
import {core} from '@jovijovi/ether-core';

// Get contract class
export function GetYaNFTContract(address: string, pk?: string): YaNFT {
	if (!pk) {
		return YaNFT__factory.connect(address, network.MyProvider.Get());
	}
	return YaNFT__factory.connect(address, core.GetWallet(pk));
}
