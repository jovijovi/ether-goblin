export type Options = {
	eventType: string[]             // ERC721 event type: mint/transfer/burn
	abi?: any
	address?: string                // The address to filter by, or null to match any address (Optional)
	fromBlock: number               // Fetch from block number
	toBlock?: number                // Fetch to block number (Optional, the highest block number by default)
	maxBlockRange?: number          // eth_getLogs block range (Optional)
	pushJobIntervals?: number       // Push job intervals (unit: ms)
	keepRunning?: boolean           // Keep running fetcher (Optional)
}
