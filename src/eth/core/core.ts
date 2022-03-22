import {BigNumber, utils, Wallet} from 'ethers';
import {Block, TransactionReceipt, TransactionResponse} from '@ethersproject/abstract-provider';
import {auditor, log} from '@jovijovi/pedrojs-common';
import * as network from '../../network';
import {customConfig} from '../../config';
import {GetConfirmations} from './common';

// GetGasPrice returns gas price (Wei)
export async function GetGasPrice(): Promise<any> {
	const provider = network.MyProvider.Get();
	const price = await provider.getGasPrice();
	const blockNumber = await provider.getBlockNumber();
	log.RequestId().debug("BlockNumber=%s, Price=%o", blockNumber.toString(), price.toString());
	return {
		blockNumber: blockNumber,
		price: price.toString(),
	}
}

// GetReceipt returns transaction receipt
export async function GetReceipt(txHash: string): Promise<TransactionReceipt> {
	const provider = network.MyProvider.Get();
	const receipt = await provider.getTransactionReceipt(txHash);
	log.RequestId().debug("txHash=%s, receipt=%o", txHash, receipt);
	return receipt;
}

// GetTxResponse returns transaction response by txHash
export async function GetTxResponse(txHash: string): Promise<TransactionResponse> {
	const provider = network.MyProvider.Get();
	return await provider.getTransaction(txHash);
}

// GetBlock returns block by blockHash
export async function GetBlock(blockHash: string): Promise<Block> {
	const provider = network.MyProvider.Get();
	return await provider.getBlock(blockHash);
}

// GetBlockNumber returns block number
export async function GetBlockNumber(): Promise<number> {
	const provider = network.MyProvider.Get();
	const blockNumber = await provider.getBlockNumber();
	log.RequestId().debug("Current BlockNumber=", blockNumber);
	return blockNumber;
}

// GetBalanceOf returns balance of address
export async function GetBalanceOf(address: string): Promise<any> {
	auditor.Check(utils.isAddress(address), 'invalid address');
	const provider = network.MyProvider.Get();
	const blockNumber = await provider.getBlockNumber();
	const balance = await provider.getBalance(address);
	log.RequestId().debug("BalanceOf(%s)=%s, blockNumber=%d", address, balance.toString(), blockNumber);
	return {
		blockNumber: blockNumber,
		balance: balance.toString()
	};
}

// Observer returns balance of address (Unit: Ether)
export async function Observer(address: string): Promise<any> {
	auditor.Check(utils.isAddress(address), 'invalid address');
	const provider = network.MyProvider.Get();
	const blockNumber = await provider.getBlockNumber();
	const balance = await provider.getBalance(address);
	return {
		blockNumber: blockNumber,
		balance: utils.formatEther(balance),    // Unit: Ether
	};
}

// Transfer
export async function Transfer(from: string, to: string, amount: string, pk: string): Promise<TransactionReceipt> {
	auditor.Check(utils.isAddress(from), 'invalid from address');
	auditor.Check(utils.isAddress(to), 'invalid to address');
	auditor.Check(utils.parseEther(amount) > BigNumber.from(0), 'invalid amount');
	auditor.Check(!!pk, 'invalid pk');

	const provider = network.MyProvider.Get();
	const feeWallet = new Wallet(pk);
	const signer = feeWallet.connect(provider);
	const gasPrice = await provider.getGasPrice();
	const nonce = await provider.getTransactionCount(from, 'latest');
	const tx = {
		from: utils.getAddress(from),
		to: utils.getAddress(to),
		value: utils.parseUnits(amount, 'wei'),
		nonce: nonce,
		gasLimit: '',
		gasPrice: gasPrice,
	};
	const gasLimit = await provider.estimateGas(tx);
	// finalGasLimit = gasLimit * gasLimitC / 100
	const finalGasLimit = gasLimit.mul(BigNumber.from(customConfig.GetTxConfig().gasLimitC)).div(100);
	tx.gasLimit = utils.hexlify(finalGasLimit);

	// Send tx
	const txRsp = await signer.sendTransaction(tx);

	// Wait tx
	const receipt = await provider.waitForTransaction(txRsp.hash, GetConfirmations());

	// Check tx status
	if (receipt.status != 1) {
		log.RequestId().error("Transfer failed, error=%o", receipt);
		return;
	}

	log.RequestId().info("Transfer completed. TxHash=%s, ChainId=%s, From=%s, To=%s, GasPrice=%d, GasLimit=%d",
		txRsp.hash, customConfig.GetChainId(), tx.from, tx.to, tx.gasPrice, tx.gasLimit);

	return receipt;
}

// Verify signature
export async function VerifySig(address: string, msg: string, sig: string): Promise<boolean> {
	auditor.Check(utils.isAddress(address), 'invalid address');
	auditor.Check(msg.length > 0, 'invalid message');
	auditor.Check(utils.isBytesLike(sig), 'invalid signature');
	const verifiedAddress = utils.verifyMessage(msg, sig)
	return verifiedAddress.toLowerCase() === address.toLowerCase();
}

// Create new wallet address (Externally Owned Account)
export async function NewWallet(entropy?: string): Promise<any> {
	auditor.Check(entropy.length <= 64, "invalid entropy, max length is 64");
	const wallet = Wallet.createRandom({
		extraEntropy: utils.toUtf8Bytes(entropy),
	});

	const rsp = {
		chain: customConfig.GetDefaultNetwork().chain,
		network: customConfig.GetDefaultNetwork().network,
		address: wallet.address,
		pk: wallet.privateKey,
		mnemonic: wallet.mnemonic.phrase,
	};

	log.RequestId().info("New wallet=%o", rsp);

	return rsp;
}
