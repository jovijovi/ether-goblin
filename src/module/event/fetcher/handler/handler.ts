import * as core from 'express-serve-static-core';
import {API} from '../api';

export function APIs(router: core.Express) {
	defaultAPIs(router);
}

function defaultAPIs(router: core.Express) {
	router.get('/api/v1/nft/history', API.GetTokenHistory);
	router.post('/api/v1/nft/events', API.FetchEvents);
}
