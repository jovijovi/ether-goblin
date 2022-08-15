// Response Builder

import {log} from '@jovijovi/pedrojs-common';
import {CodeBadRequest} from './code';
import {customConfig} from '../../config';

// BuildResponse returns response by params
export function BuildResponse(code: string, data: any, msg?: string): any {
	return {
		code: code,
		msg: msg,
		data: data
	};
}

export function BadRequest(res, code = CodeBadRequest): any {
	return res.status(400).send({
		code: code,
		msg: 'Bad request',
	});
}

export function NotFound(res, code?: string): any {
	return res.status(404).send({
		code: code,
		msg: 'Not found',
	});
}

export function Error(res, e, code?: string): any {
	if (e && e.code && e.message) {
		log.RequestId().error("code=%s, message=%s", e.code, e.message);
	}

	let httpStatusCode = 500;
	if (e.message.toString().includes('Not found')) {
		httpStatusCode = 404;
	}

	return res.status(httpStatusCode).send({
		code: e.code ? e.code.toString() : code,
		msg: e.message,
	});
}

export function OK(data?: any, msg?: string): any {
	return {
		code: customConfig.GetRestAPIRspCode().OK,
		msg: msg,
		data: data
	};
}
