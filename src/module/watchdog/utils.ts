import {BigNumber} from 'ethers';
import {network} from '@jovijovi/ether-network';
import {retry} from '@jovijovi/pedrojs-common/util';
import {DefaultRetryMaxInterval, DefaultRetryMinInterval, DefaultRetryTimes} from './params';

// Retry get balance
export async function RetryGetBalance(address: string, blockNumber: number): Promise<BigNumber> {
	const provider = network.MyProvider.Get();
	return await retry.Run(async (): Promise<BigNumber> => {
		return await provider.getBalance(address, blockNumber);
	}, DefaultRetryTimes, retry.RandomRetryInterval(DefaultRetryMinInterval, DefaultRetryMaxInterval), false);
}
