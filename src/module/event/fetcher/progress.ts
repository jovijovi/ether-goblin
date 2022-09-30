import ProgressBar from 'progress';

export function NewProgress(total: number) {
	return new ProgressBar('\r *** Fetching [:bar] :rate/BPS :percent :etas *** ', {
		complete: '=',
		incomplete: ' ',
		width: 20,
		total: total,
	});
}
