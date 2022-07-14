import nodemailer from 'nodemailer';
import {log} from '@jovijovi/pedrojs-common';
import {customConfig} from '../config';
import * as util from 'util';

export type MailContent = {
	subject: string
	text: string
	html?: string
}

// Send mail by configuration
export async function Send(mailConf: customConfig.Mailer, mailContent: MailContent) {
	try {
		// create reusable transporter object using the default SMTP transport
		const transporter = nodemailer.createTransport({
			host: mailConf.smtp,
			port: mailConf.port,
			secure: mailConf.secure,
			auth: {
				user: mailConf.user,
				pass: mailConf.password,
			},
		});

		const message = {
			from: util.format('"%s" <%s>', mailConf.sender, mailConf.user), // sender address
			to: mailConf.receivers.toString(), // list of receivers
			subject: mailContent.subject, // Subject line
			text: mailContent.text, // plain text body
			html: mailContent.html, // html body
		};

		// send mail with defined transport object
		await transporter.sendMail(message, (err) => {
			if (err) {
				log.RequestId().error("Send mail failed, error=", err);
				return;
			}

			// only needed when using pooled connections
			transporter.close();

			log.RequestId().info("Send mail successfully");
		});

		log.RequestId().debug("Sending mail...");
	} catch (e) {
		log.RequestId().error(e);
		return;
	}
}
