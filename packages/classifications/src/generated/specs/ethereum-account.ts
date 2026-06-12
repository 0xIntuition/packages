import type { ClassificationSpec } from '../../types.js';

export const ethereumAccount: ClassificationSpec = {
	slug: 'ethereum-account',
	type: 'EthereumAccount',
	displayName: 'Ethereum Account',
	description: 'A wallet or externally owned account identity on an EVM chain.',
	category: 'Blockchain',
	schema: {
		context: 'https://schema.intuition.systems/v1/ethereum.jsonld',
		type: 'EthereumAccount',
	},
	metadataPredicates: ['linkedAccount'] as const,
	fields: [
		{
			key: 'address',
			label: 'Address',
			description: 'The Ethereum address of the account.',
			fieldType: 'address',
			required: true,
			placeholder: '0x...',
		},
	],
	defaults: { pluginId: 'ethereum-account', provider: 'etherscan' },
};
