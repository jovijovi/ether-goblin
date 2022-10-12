import {constants} from 'ethers';
import {util} from '@jovijovi/pedrojs-common';
import {EventTypeBurn, EventTypeMint, EventTypeTransfer} from '../common/constants';
import {DefaultJobIDLength, DefaultNanoIDAlphabet} from './params';

// Check if the event topics is ERC721 compliant.
export function CheckTopics(topics: Array<string>): boolean {
	if (!topics) {
		return false;
	}

	return !!(topics.length === 4
		&& topics[0]
		&& topics[1]
		&& topics[2]
		&& topics[3]);
}

// Check event type
export function CheckEventType(topics: Array<string>, eventType: string[]): boolean {
	return eventType.includes(GetEventType(topics));
}

// Get event type
export function GetEventType(topics: Array<string>): string {
	// Check if it is mint event by 'from'
	if (topics[1] === constants.HashZero) {
		return EventTypeMint;
	}
	// Check if it is burn event by 'to'
	else if (topics[2] === constants.HashZero) {
		return EventTypeBurn;
	}
	// Check if it is transfer event
	else if (topics[1] !== constants.HashZero
		&& topics[2] !== constants.HashZero) {
		return EventTypeTransfer;
	}

	return undefined;
}

// New job ID
export function NewJobID(): string {
	return util.nanoid.NewNanoID({
		alphabet: DefaultNanoIDAlphabet,
		size: DefaultJobIDLength,
	});
}
