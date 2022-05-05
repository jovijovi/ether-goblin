// Transfer Event
export type EventTransfer = {
	address: string         // NFT Contract address
	blockNumber: number     // Block number
	blockHash: string       // Block hash
	transactionHash: string // Tx hash
	from: string            // From
	to: string              // To
	tokenId: number         // NFT Token ID
}
