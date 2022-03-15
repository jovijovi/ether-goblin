import * as core from 'express-serve-static-core';
import {API} from '../api';

export function APIs(router: core.Express) {
	ethAPIs(router);
	publicAPIs(router);
}

function ethAPIs(router: core.Express) {
	router.get('/api/v1/eth/gasPrice', API.getGasPrice);
	router.get('/api/v1/eth/receipt', API.getReceipt);
	router.get('/api/v1/eth/blockNumber', API.getBlockNumber);
	router.get('/api/v1/eth/balanceOf', API.getBalanceOf);
	router.post('/api/v1/eth/transfer', API.transfer);
	router.post('/api/v1/eth/verify', API.verifySignature);
}

function publicAPIs(router: core.Express) {
	router.get('/address/:address', API.observer);
}
