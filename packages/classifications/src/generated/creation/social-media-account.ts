import type { CreationProfile } from '../../creation-profile.js';

export const socialMediaAccountCreationProfile = {
	classification: {
		slug: 'social-media-account',
		type: 'SocialMediaAccount',
		displayName: 'Social Media Account',
		description: 'A social profile identity keyed by username and platform.',
		category: 'Web',
		schema: {
			context: 'https://schema.intuition.systems/v1/social-media-account.jsonld',
			type: 'SocialMediaAccount',
		},
	},
	fields: [
		{
			key: 'username',
			label: 'Username',
			description: 'The handle or account username.',
			fieldType: 'string',
			required: true,
			placeholder: 'karpathy',
			schema: null,
		},
		{
			key: 'platform',
			label: 'Platform',
			description: 'The social platform name.',
			fieldType: 'string',
			required: true,
			placeholder: 'x',
			schema: null,
		},
		{
			key: 'url',
			label: 'Profile URL',
			description: 'The canonical profile URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://x.com/karpathy',
			schema: null,
		},
		{
			key: 'platformUserId',
			label: 'Platform User ID',
			description: 'The immutable platform-assigned user ID (survives handle renames).',
			fieldType: 'string',
			required: false,
			placeholder: '295218901',
			schema: null,
		},
	],
	relationships: [
		{
			subjectClassification: 'social-media-account',
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
		{
			subjectClassification: 'social-media-account',
			predicate: {
				key: 'url',
				id: '0x71dbe59780ccedf37166aa55781573d8aea463285cdfe94a5b08ed5f474613a3',
				label: 'url',
				description: 'Links the subject atom to its canonical URL or web-addressable identifier',
				status: 'enshrined',
				category: 'Metadata/Linking',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'primitive',
					valueType: 'url',
				},
			],
		},
		{
			subjectClassification: 'social-media-account',
			predicate: {
				key: 'availableOn',
				id: '0xea46b891287568210d4614fdb31147cd009ad6d7731657c5341889b3789eceeb',
				label: 'available on',
				description:
					'Indicates the subject can be accessed, purchased, or used on the object platform or chain',
				status: 'proposed',
				category: 'Metadata/Linking',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'software',
				},
				{
					kind: 'classification',
					slug: 'software-application',
				},
				{
					kind: 'classification',
					slug: 'defined-term',
				},
			],
		},
	],
	availableFieldCount: 4,
} as const satisfies CreationProfile;

export const creationProfile = socialMediaAccountCreationProfile;
export default socialMediaAccountCreationProfile;
