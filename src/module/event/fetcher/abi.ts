const mint = [
	{
		inputs: [
			{
				internalType: "address",
				name: "to",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256",
			},
		],
		name: "mint",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	}
];

const mintWithURI = [
	{
		inputs: [
			{
				internalType: "address",
				name: "to",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256",
			},
			{
				internalType: "bytes",
				name: "uri",
				type: "bytes",
			},
		],
		name: "mintWithURI",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	}
];

const mintForCreator = [
	{
		inputs: [
			{
				internalType: "address",
				name: "creator",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256",
			},
			{
				components: [
					{
						internalType: "string",
						name: "tokenURI",
						type: "string",
					},
					{
						internalType: "bytes32",
						name: "contentHash",
						type: "bytes32",
					},
				],
				internalType: "struct IMedia.MediaData",
				name: "data",
				type: "tuple",
			},
		],
		name: "mintForCreator",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	}
];

export const enum ABI {
	mint = 'mint',
	mintWithURI = 'mintWithURI',
	mintForCreator = 'mintForCreator',
}

// ABI Mapper
export const ABIMapper = new Map([
	[ABI.mint, mint],
	[ABI.mintWithURI, mintWithURI],
	[ABI.mintForCreator, mintForCreator],
]);
