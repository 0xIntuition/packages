import type { ClassificationSpec } from '../../types.js';

export const ethereumSmartContract: ClassificationSpec = {
	slug: 'ethereum-smart-contract',
	type: 'EthereumSmartContract',
	displayName: 'Ethereum Smart Contract',
	description: 'A deployed smart contract identity on an EVM chain.',
	category: 'Blockchain',
	schema: {
		context: 'https://schema.intuition.systems/v1/ethereum.jsonld',
		type: 'EthereumSmartContract',
	},
	metadataPredicates: ['implement', 'governedBy', 'use'] as const,
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
			description: 'The Ethereum address of the deployed contract.',
			fieldType: 'address',
			required: true,
			placeholder: '0x...',
		},
	],
	defaults: { pluginId: 'ethereum-smart-contract', provider: 'etherscan' },
};
