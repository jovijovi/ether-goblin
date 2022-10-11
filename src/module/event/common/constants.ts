import {utils} from 'ethers';

// ERC721 event names
export const EventNameTransfer = 'Transfer(address,address,uint256)';
export const EventNameMint = EventNameTransfer;
export const EventNameBurn = EventNameTransfer;

// ERC721 event types
export const EventTypeMint = 'mint';
export const EventTypeTransfer = 'transfer';
export const EventTypeBurn = 'burn';

// mapper: EventType - EventName
export const EventMapper = new Map([
	[EventTypeMint, EventNameMint],
	[EventTypeTransfer, EventNameTransfer],
	[EventTypeBurn, EventNameBurn],
]);

// mapper: EventName - TopicID
export const EventNameMapper = new Map([
	[EventNameMint, utils.id(EventNameMint)],
	[EventNameTransfer, utils.id(EventNameTransfer)],
	[EventNameBurn, utils.id(EventNameBurn)],
])

// Time unit in millisecond
// Day/Hour/Minute/Second
export const TimeDayInMs = 1000 * 60 * 60 * 24;
export const TimeHourInMs = 1000 * 60 * 60;
export const TimeMinuteInMs = 1000 * 60;
export const TimeSecondInMs = 1000;
