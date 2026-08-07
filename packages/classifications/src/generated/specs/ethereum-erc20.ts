import type { ClassificationSpec } from '../../types.js';

export const ethereumErc20: ClassificationSpec = {
	slug: 'ethereum-erc20',
	type: 'EthereumERC20',
	displayName: 'ERC-20 Token',
	description: 'A fungible token contract identity on an EVM chain.',
	category: 'Blockchain',
	schema: {
		context: 'https://schema.intuition.systems/v1/ethereum.jsonld',
		type: 'EthereumERC20',
	},
	metadataPredicates: ['listedOn', 'pricedIn', 'backedBy'] as const,
	fields: [
		{
			key: 'chainId',
			label: 'Chain ID',
			description: 'The EVM chain identifier.',
			fieldType: 'integer',
			required: true,
			placeholder: '1',
		},
		{
			key: 'address',
			label: 'Contract Address',
			description: 'The Ethereum address of the token contract.',
			fieldType: 'address',
			required: true,
			placeholder: '0x...',
		},
		{
			key: 'name',
			label: 'Token Name',
			description: 'The human-readable token name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Ether',
		},
		{
			key: 'symbol',
			label: 'Symbol',
			description: 'The token ticker symbol.',
			fieldType: 'string',
			required: true,
			placeholder: 'ETH',
		},
		{
			key: 'decimals',
			label: 'Decimals',
			description: 'The number of token decimal places.',
			fieldType: 'integer',
			required: true,
			placeholder: '18',
		},
	],
	defaults: { pluginId: 'ethereum-smart-contract', provider: 'etherscan' },
	identity: {
		identifies: 'a token asset on a chain',
		ladder: [
			{ kind: 'scheme', scheme: 'caip19', source: { kind: 'derivation', name: 'caip19-erc20' } },
		],
	},
};
