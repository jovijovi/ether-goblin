import * as core from 'express-serve-static-core';
import {API} from '../api';

export function APIs(router: core.Express) {
	ethAPIs(router);
	publicAPIs(router);
}

function ethAPIs(router: core.Express) {
	router.get('/api/v1/eth/gasPrice', API.getGasPrice);
	router.get('/api/v1/eth/receipt', API.getTxReceipt);
	router.get('/api/v1/eth/tx', API.getTxResponse);
	router.get('/api/v1/eth/block', API.getBlock);
	router.get('/api/v1/eth/blockNumber', API.getBlockNumber);
	router.get('/api/v1/eth/balanceOf', API.getBalanceOf);
	router.post('/api/v1/eth/transfer', API.transfer);
	router.post('/api/v1/eth/verify', API.verifySignature);
	router.post('/api/v1/eth/verify/:address', API.verifyAddress);
	router.post('/api/v1/eth/wallet', API.newWallet);
	router.post('/api/v1/eth/wallet/json', API.newJsonWallet);
	router.post('/api/v1/eth/wallet/json/mnemonic', API.retrieveJsonWalletFromMnemonic);
	router.post('/api/v1/eth/wallet/json/pk', API.retrieveJsonWalletFromPK);
	router.post('/api/v1/eth/wallet/json/inspect', API.inspectJsonWallet);
}

function publicAPIs(router: core.Express) {
	router.get('/address/:address', API.observer);
}
