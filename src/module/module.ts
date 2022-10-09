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

// Loader mapper
const loaderMapper = new Map([
	[ModuleWatchdog, watchdogLoader],
	[ModuleEventListener, eventListenerLoader],
	[ModuleEventFetcher, eventFetcherLoader],
])

// Module loader
function loader(id: string) {
	return loaderMapper.get(id)();
}

// Load module by config
export function Load() {
	customConfig.GetWatchdog().enable ? loader(ModuleWatchdog) : false;
	customConfig.GetEvents().listener.enable ? loader(ModuleEventListener) : false;
	customConfig.GetEvents().fetcher.enable ? loader(ModuleEventFetcher) : false;
}
