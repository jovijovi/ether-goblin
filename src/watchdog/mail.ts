import fs from 'fs';
import {DefaultAlertMailTemplate, DefaultAlertType} from './params';

// Generate mail in HTML format
export function GenHtmlMail(alertType: DefaultAlertType, arg: any): string {
	let template = '';

	switch (alertType) {
		case DefaultAlertType.BalanceReachLimit:
			template = fs.readFileSync(DefaultAlertMailTemplate.BalanceReachLimit.Path, 'utf8');
			template = template.replace(/\${address}/gi, arg.address);
			template = template.replace(/\${rule}/gi, arg.rule);
			template = template.replace(/\${balanceCurrent}/gi, arg.balanceCurrent);
			template = template.replace(/\${limit}/gi, arg.limit);
			template = template.replace(/\${addressUrl}/gi, arg.addressUrl);
			template = template.replace(/\${blockNumber}/gi, arg.blockNumber);
			template = template.replace(/\${chain}/gi, arg.chain);
			template = template.replace(/\${network}/gi, arg.network);
			template = template.replace(/\${chainId}/gi, arg.chainId);
			return template;

		case DefaultAlertType.BalanceChanges:
			template = fs.readFileSync(DefaultAlertMailTemplate.BalanceChanges.Path, 'utf8');
			template = template.replace(/\${address}/gi, arg.address);
			template = template.replace(/\${rule}/gi, arg.rule);
			template = template.replace(/\${balanceCurrent}/gi, arg.balanceCurrent);
			template = template.replace(/\${balancePrevious}/gi, arg.balancePrevious);
			template = template.replace(/\${balanceChanged}/gi, arg.balanceChanged);
			template = template.replace(/\${addressUrl}/gi, arg.addressUrl);
			template = template.replace(/\${blockNumber}/gi, arg.blockNumber);
			template = template.replace(/\${chain}/gi, arg.chain);
			template = template.replace(/\${network}/gi, arg.network);
			template = template.replace(/\${chainId}/gi, arg.chainId);
			return template;
	}

	return undefined;
}
