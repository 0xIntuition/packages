import type { CreationProfile } from '../../creation-profile.js';

export const ethereumAccountCreationProfile = {
	classification: {
		slug: 'ethereum-account',
		type: 'EthereumAccount',
		displayName: 'Ethereum Account',
		description: 'A wallet or externally owned account identity on an EVM chain.',
		category: 'Blockchain',
		schema: {
			context: 'https://schema.intuition.systems/v1/ethereum.jsonld',
			type: 'EthereumAccount',
		},
	},
	fields: [
		{
			key: 'address',
			label: 'Address',
			description: 'The Ethereum address of the account.',
			fieldType: 'address',
			required: true,
			placeholder: '0x...',
			schema: null,
		},
	],
	relationships: [
		{
			subjectClassification: 'ethereum-account',
			predicate: {
				key: 'linkedAccount',
				id: '0xd8a32acc6237ab21be285953b01508c7a22f523bf122aa3ab044b21d266c2c6c',
				label: 'linked account',
				description: 'Connects the subject identity to one of its platform account atoms',
				status: 'enshrined',
				category: 'Metadata/Linking',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'any',
					reason:
						'Account links can target wallets, social profiles, platform accounts, or owner atoms until ownership semantics are split.',
				},
			],
		},
	],
	availableFieldCount: 1,
} as const satisfies CreationProfile;

export const creationProfile = ethereumAccountCreationProfile;
export default ethereumAccountCreationProfile;
