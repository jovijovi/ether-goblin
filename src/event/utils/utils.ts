import {constants} from 'ethers';
import {EventTypeBurn, EventTypeMint, EventTypeTransfer} from '../common/constants';

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
	// Check if it is mint event by 'from'
	if (topics[1] === constants.HashZero
		&& eventType.includes(EventTypeMint)) {
		return true;
	}
	// Check if it is burn event by 'to'
	else if (topics[2] === constants.HashZero
		&& eventType.includes(EventTypeBurn)) {
		return true;
	}
	// Check if it is transfer event
	else if (topics[1] !== constants.HashZero
		&& topics[2] !== constants.HashZero
		&& eventType.includes(EventTypeTransfer)) {
		return true;
	}

	return false;
}
