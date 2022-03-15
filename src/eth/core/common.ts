import {Wallet} from 'ethers';
import * as network from '../../network';
import {customConfig} from '../../config';

// Transfer confirmations by default
const TransferConfirmations = 7;

// GetWallet returns wallet
export function GetWallet(pk: string): Wallet {
	if (!pk) {
		throw new Error('invalid pk');
	}
	return new Wallet(pk, network.MyProvider.Get());
}

// GetConfirmations returns tx confirmations
export function GetConfirmations(): number {
	return customConfig.GetTxConfig().confirmations ? customConfig.GetTxConfig().confirmations : TransferConfirmations;
}
