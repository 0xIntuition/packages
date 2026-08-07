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
	identity: {
		identifies: 'an EOA/keypair (D24: fixed eip155:1)',
		ladder: [
			{ kind: 'scheme', scheme: 'caip10', source: { kind: 'derivation', name: 'caip10-eoa' } },
		],
	},
};
