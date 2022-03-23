import {MailContent} from './mailer';
import * as util from 'util';

export namespace Template {
	export function BalanceAlertMailContent(message: any): MailContent {
		if (!message) {
			return;
		}

		return {
			subject: util.format('Balance Alert: %s', message.subject),
			text: message.text,
			html: message.html,
		}
	}
}
