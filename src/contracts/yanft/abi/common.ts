import {YaNFT, YaNFT__factory} from '../../../../typechain-types';
import * as network from '../../../network';
import {Common} from '../../../eth/core';

// Get contract class
export function GetYaNFTContract(address: string, pk?: string): YaNFT {
	if (!pk) {
		return YaNFT__factory.connect(address, network.MyProvider.Get());
	}
	return YaNFT__factory.connect(address, Common.GetWallet(pk));
}
