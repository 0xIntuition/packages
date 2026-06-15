import type { CreationProfile } from '../../creation-profile.js';

export const ethereumErc20CreationProfile = {
	classification: {
		slug: 'ethereum-erc20',
		type: 'EthereumERC20',
		displayName: 'ERC-20 Token',
		description: 'A fungible token contract identity on an EVM chain.',
		category: 'Blockchain',
		schema: {
			context: 'https://schema.intuition.systems/v1/ethereum.jsonld',
			type: 'EthereumERC20',
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
			description: 'The Ethereum address of the token contract.',
			fieldType: 'address',
			required: true,
			placeholder: '0x...',
			schema: null,
		},
		{
			key: 'name',
			label: 'Token Name',
			description: 'The human-readable token name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Ether',
			schema: null,
		},
		{
			key: 'symbol',
			label: 'Symbol',
			description: 'The token ticker symbol.',
			fieldType: 'string',
			required: true,
			placeholder: 'ETH',
			schema: null,
		},
		{
			key: 'decimals',
			label: 'Decimals',
			description: 'The number of token decimal places.',
			fieldType: 'integer',
			required: true,
			placeholder: '18',
			schema: null,
		},
	],
	relationships: [
		{
			subjectClassification: 'ethereum-erc20',
			predicate: {
				key: 'listedOn',
				id: '0x3733d2a7feec6156531fbd7390ac494d6764a8a8ea50abae0963806d19d34ce4',
				label: 'listed on',
				description:
					'The subject asset or product is available for trading or purchase on the object exchange or marketplace',
				status: 'proposed',
				category: 'Economic/Market',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'company',
				},
				{
					kind: 'classification',
					slug: 'software',
				},
				{
					kind: 'classification',
					slug: 'software-application',
				},
			],
		},
		{
			subjectClassification: 'ethereum-erc20',
			predicate: {
				key: 'pricedIn',
				id: '0x625fe16917efdec30f6ffe606ffefe17a504204a1022b3e62911c547aa5da641',
				label: 'priced in',
				description:
					'The subject asset or service is denominated or quoted in the object currency or token',
				status: 'proposed',
				category: 'Domain-Specific',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'ethereum-erc20',
				},
				{
					kind: 'classification',
					slug: 'defined-term',
				},
			],
		},
		{
			subjectClassification: 'ethereum-erc20',
			predicate: {
				key: 'backedBy',
				id: '0x6bea1623e6d3273aa6d31becdc29782e77ac141dbb87f51aa3994552e5e653bb',
				label: 'backed by',
				description:
					'The subject asset or instrument is collateralized, guaranteed, or underwritten by the object asset or entity',
				status: 'proposed',
				category: 'Economic/Market',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'ethereum-erc20',
				},
				{
					kind: 'classification',
					slug: 'defined-term',
				},
			],
		},
	],
	availableFieldCount: 5,
} as const satisfies CreationProfile;

export const creationProfile = ethereumErc20CreationProfile;
export default ethereumErc20CreationProfile;
