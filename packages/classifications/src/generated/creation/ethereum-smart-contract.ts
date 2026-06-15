import type { CreationProfile } from '../../creation-profile.js';

export const ethereumSmartContractCreationProfile = {
	classification: {
		slug: 'ethereum-smart-contract',
		type: 'EthereumSmartContract',
		displayName: 'Ethereum Smart Contract',
		description: 'A deployed smart contract identity on an EVM chain.',
		category: 'Blockchain',
		schema: {
			context: 'https://schema.intuition.systems/v1/ethereum.jsonld',
			type: 'EthereumSmartContract',
		},
	},
	fields: [
		{
			key: 'chainId',
			label: 'Chain ID',
			description: 'The EVM chain identifier.',
			fieldType: 'integer',
			required: true,
			placeholder: '1',
			schema: null,
		},
		{
			key: 'address',
			label: 'Contract Address',
			description: 'The Ethereum address of the deployed contract.',
			fieldType: 'address',
			required: true,
			placeholder: '0x...',
			schema: null,
		},
	],
	relationships: [
		{
			subjectClassification: 'ethereum-smart-contract',
			predicate: {
				key: 'implement',
				id: '0xfdcee9a5a6150ffa458518d0f1b50eeed5f42b6aee269aab71d00d869d6fbbd1',
				label: 'implement',
				description:
					'The subject contract, application, or system implements the object standard, specification, or interface',
				status: 'proposed',
				category: 'Domain-Specific',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'defined-term',
				},
			],
		},
		{
			subjectClassification: 'ethereum-smart-contract',
			predicate: {
				key: 'governedBy',
				id: '0x3faa6781f4475e91fecce9a5aba7fbb9b31bbacdb1e3d6313ec353764d75a21f',
				label: 'governed by',
				description:
					'The subject protocol, contract, or entity is under the governance authority of the object',
				status: 'proposed',
				category: 'Domain-Specific',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'defined-term',
				},
				{
					kind: 'classification',
					slug: 'ethereum-erc20',
				},
				{
					kind: 'classification',
					slug: 'company',
				},
			],
		},
		{
			subjectClassification: 'ethereum-smart-contract',
			predicate: {
				key: 'use',
				id: '0x746e295c01785421b2f1a311ff3a5830676e141e09e45fde962f84b2533f7af6',
				label: 'use',
				description:
					'The subject utilizes, integrates, or depends on the object tool, technology, or resource',
				status: 'proposed',
				category: 'Domain-Specific',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'any',
					reason:
						'Usage can target software, protocols, tokens, concepts, or other atoms depending on the subject context.',
				},
			],
		},
	],
	availableFieldCount: 2,
} as const satisfies CreationProfile;

export const creationProfile = ethereumSmartContractCreationProfile;
export default ethereumSmartContractCreationProfile;
