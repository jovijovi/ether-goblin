import ProgressBar from 'progress';
import {customConfig} from '../../../config';

// New progress bar
export function NewProgressBar(total: number) {
	if (!customConfig.GetEvents().fetcher.progressBar) {
		return;
	}

	return new ProgressBar('\r *** Fetching [:bar] :rate/BPS :percent :etas *** ', {
		complete: '=',
		incomplete: ' ',
		width: 20,
		total: total,
	});
}

// Update progress bar
export function UpdateProgressBar(progressBar: any, tick: number) {
	if (!customConfig.GetEvents().fetcher.progressBar || !progressBar) {
		return;
	}

	progressBar.tick(tick);
}
