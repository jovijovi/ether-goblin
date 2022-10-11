import * as core from 'express-serve-static-core';
import {log} from '@jovijovi/pedrojs-common';
import {ITaskHandler} from '@jovijovi/pedrojs-network-http';
import {TwoFAToken} from '@jovijovi/express-2fa-token';
import * as eth from '@jovijovi/ether-core-api';
import {APIs} from './types';
import {yanft} from '../contracts';

function defaultAPIs(router: core.Express) {
	eth.Handler.APIs(router);
	yanft.Handler.APIs(router);
	router.use(notFound);
}

class privateImplHandlers implements ITaskHandler {
	private readonly _apis: Map<string, APIs>

	constructor() {
		this._apis = new Map();
	}

	RegisterHandlers(router: core.Express) {
		for (const [id, api] of this._apis) {
			api(router);
			log.RequestId().info("HTTP APIs(%s) registered", id);
		}

		defaultAPIs(router);
	}

	UseMiddleware(app: core.Express) {
		app.use(TwoFAToken);
	}

	RegisterAPIs(id: string, api: APIs) {
		this._apis.set(id, api);
	}
}

function notFound(req, res, next) {
	res.status(404).send({
		error: 'Not found',
	});
	next();
}

export const RestfulHandlers = new privateImplHandlers();
