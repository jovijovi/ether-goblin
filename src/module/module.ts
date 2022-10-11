import {loader} from '@jovijovi/pedrojs-loader';
import {customConfig} from '../config';
import {watchdog} from './watchdog';
import * as event from './event';
import {RestfulHandlers} from '../handler';
import {ModuleEventFetcher, ModuleEventListener, ModuleWatchdog} from './id';

// Watchdog loader
const watchdogLoader = () => {
	watchdog.Run();
};

// Event listener loader
const eventListenerLoader = () => {
	event.listener.Run();
}

// Event fetcher loader
const eventFetcherLoader = () => {
	// Run fetcher
	event.fetcher.Run();

	// Register HTTP APIs
	RestfulHandlers.RegisterAPIs(ModuleEventFetcher, event.fetcher.Handler.APIs);
}

// Load module by config
export function Load() {
	customConfig.GetWatchdog().enable ? loader.Load(ModuleWatchdog, watchdogLoader) : false;
	customConfig.GetEvents().listener.enable ? loader.Load(ModuleEventListener, eventListenerLoader) : false;
	customConfig.GetEvents().fetcher.enable ? loader.Load(ModuleEventFetcher, eventFetcherLoader) : false;
}
