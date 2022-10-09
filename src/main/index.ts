import {http} from '@jovijovi/pedrojs-network-http';
import {config, log, sys} from '@jovijovi/pedrojs-common';
import {network} from '@jovijovi/ether-network';
import {customConfig} from '../config';
import {logo} from './logo';
import {RestfulHandlers} from '../handler';
import {module} from '../module';

function main() {
	log.logo(logo);
	sys.HandleSignals();
	config.LoadConfig();
	customConfig.LoadCustomConfig();

	network.LoadConfig(customConfig.Get());
	network.isConnected().then(r => {
		if (!r) {
			sys.Shutdown();
		}
	});

	module.Load();

	http.server.Run(RestfulHandlers);
}

main();
