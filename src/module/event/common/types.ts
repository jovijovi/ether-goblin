// Transfer Event
export type EventTransfer = {
	address: string         // NFT Contract address
	blockNumber: number     // Block number
	blockHash: string       // Block hash
	blockTimestamp?: number // Block timestamp
	transactionHash: string // Tx hash
	from: string            // From
	to: string              // To
	tokenId: number         // NFT Token ID
	eventType?: string      // Event type
}

// Response of Restful API
export type Response = {
	code: string
	msg: string
	data?: object
}
