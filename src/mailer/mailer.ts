import fs from 'fs';
import path from 'path';
import * as util from 'util';
import nodemailer from 'nodemailer';
import nodemailerOpenpgp from 'nodemailer-openpgp';
import {log} from '@jovijovi/pedrojs-common';
import {Queue} from '@jovijovi/pedrojs-common/util';
import {customConfig} from '../config';
import {Cache} from '../common/cache';
import {MailContent, MailQueue} from './types';

export class Mailer {
	private readonly _queue: MailQueue;     // Mail queue (ASC, FIFO)
	private _config: customConfig.Mailer;   // Mailer config

	constructor(mailConf?: customConfig.Mailer) {
		// Create mail queue
		this._queue = new Queue<MailContent>();

		if (mailConf) {
			this.Init(mailConf);
		}
	}

	// Set mail configuration
	public Init(mailConf?: customConfig.Mailer) {
		this._config = mailConf;
	}

	// Queue returns mail queue
	public Queue(): Queue<MailContent> {
		return this._queue;
	}

	// Send mail
	public async Send(mailContent: MailContent) {
		// Create reusable transporter object using the default SMTP transport
		const transporter = nodemailer.createTransport({
			host: this._config.smtp,
			port: this._config.port,
			secure: this._config.secure,
			auth: {
				user: this._config.user,
				pass: this._config.password,
			},
		});

		// Build message
		const message = {
			from: util.format('"%s" <%s>', this._config.sender, this._config.user), // sender address
			to: this._config.receivers.toString(), // list of receivers
			subject: mailContent.subject, // Subject line
			text: mailContent.text, // plain text body
			html: mailContent.html, // html body
			shouldSign: this._config.pgp.enable ? this._config.pgp.enable : false, // true: sign an outgoing message; false: not sign
		};

		// PGP
		if (this._config.pgp && this._config.pgp.enable) {
			const getKey = (): string => {
				const key = fs.readFileSync(path.resolve(this._config.pgp.signingKey), 'utf-8');
				Cache.CachePGPSecretKey.set(this._config.pgp.signingKey, key);
				return key;
			}
			const secretKey: string = Cache.CachePGPSecretKey.has(this._config.pgp.signingKey)
				? Cache.CachePGPSecretKey.get(this._config.pgp.signingKey) : getKey();

			const openpgpEncrypt = nodemailerOpenpgp.openpgpEncrypt;
			transporter.use(
				'stream',
				openpgpEncrypt({
					signingKey: secretKey,
					passphrase: new TextDecoder().decode(new Uint8Array(Buffer.from(this._config.pgp.passphrase, 'base64'))),
				})
			);
		}

		// Send mail with defined transport object
		await transporter.sendMail(message, (err) => {
			if (err) {
				log.RequestId().error("Send mail failed, error=", err);
				return;
			}

			// Only needed when using pooled connections
			transporter.close();

			log.RequestId().info("Send mail successfully");
		});

		log.RequestId().debug("Sending mail...");
	}

	// Config returns mail config
	public Config(): customConfig.Mailer {
		return this._config;
	}
}
