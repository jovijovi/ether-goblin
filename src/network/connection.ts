import {log} from '@jovijovi/pedrojs-common';
import {customConfig} from '../config';
import {MyProvider} from './provider';

// Check the chain is connected
export async function isConnected(): Promise<boolean> {
	try {
		const provider = MyProvider.Get();
		const blockNumber = await provider.getBlockNumber();
		const chain = await provider.getNetwork();
		log.RequestId().info("Network(%s) Chain(%d) connected, BlockNumber=%d",
			customConfig.GetDefaultNetwork(), chain.chainId, blockNumber);
	} catch (e) {
		log.RequestId().fatal('Network(%s) Chain(%d) connect failed, %o',
			customConfig.GetDefaultNetwork(), customConfig.GetChainId(), e);
		return false;
	}

	return true;
}
