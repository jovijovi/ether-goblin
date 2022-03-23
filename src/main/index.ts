import {http} from '@jovijovi/pedrojs-network-http';
import {config, log, sys} from '@jovijovi/pedrojs-common';
import {customConfig} from '../config';
import {logo} from './logo';
import * as network from '../network';
import {RestfulHandlers} from '../handler';
import {watchdog} from '../watchdog';

function main() {
	log.logo(logo);
	sys.HandleSignals();
	config.LoadConfig();
	customConfig.LoadCustomConfig();
	http.server.Run(RestfulHandlers);

	network.isConnected().then(r => {
		if (!r) {
			sys.Shutdown();
		}
	});

	watchdog.Run();
}

main();
