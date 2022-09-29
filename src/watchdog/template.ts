import * as util from 'util';
import {MailContent} from '../mailer';

// Build balance alert mail content
export function BuildBalanceAlertMailContent(message: any): MailContent {
	if (!message) {
		return;
	}

	return {
		subject: util.format('Balance Alert: %s', message.subject),
		text: message.text,
		html: message.html,
	}
}
