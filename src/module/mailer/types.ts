import {Queue} from '@jovijovi/pedrojs-common/util';

// Mail content
export interface MailContent {
	subject: string;
	text: string;
	html?: string;
}

// Mail queue
export type MailQueue = Queue<MailContent>;
