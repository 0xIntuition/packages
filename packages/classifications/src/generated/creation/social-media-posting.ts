import type { CreationProfile } from '../../creation-profile.js';

export const socialMediaPostingCreationProfile = {
	classification: {
		slug: 'social-media-posting',
		type: 'SocialMediaPosting',
		displayName: 'Social Media Posting',
		description: 'A social media post with name, text, and canonical URL.',
		category: 'Web',
		schema: {
			context: 'https://schema.org/',
			type: 'SocialMediaPosting',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Post Title',
			description: 'A short title or name for the post.',
			fieldType: 'string',
			required: true,
			placeholder: 'Intuition Is Taking Over The World',
			schemaProperty: 'name',
			schema: {
				context: 'https://schema.org/',
				property: 'name',
				propertyId: 'schema:name',
				label: 'name',
				comment: 'The name of the item.',
				originType: 'Thing',
				originTypeId: 'schema:Thing',
				rangeIncludes: ['Text'],
			},
		},
		{
			key: 'text',
			label: 'Post Text',
			description: 'The main text of the post.',
			fieldType: 'string',
			required: true,
			placeholder: 'Intuition, the onchain knowledge graph, is taking over the world.',
			schemaProperty: 'text',
			schema: {
				context: 'https://schema.org/',
				property: 'text',
				propertyId: 'schema:text',
				label: 'text',
				comment: 'The textual content of this CreativeWork.',
				originType: 'CreativeWork',
				originTypeId: 'schema:CreativeWork',
				rangeIncludes: ['Text'],
			},
		},
		{
			key: 'url',
			label: 'Post URL',
			description: 'The canonical post URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://example.com/posts/launch-thread',
			schemaProperty: 'url',
			schema: {
				context: 'https://schema.org/',
				property: 'url',
				propertyId: 'schema:url',
				label: 'url',
				comment: 'URL of the item.',
				originType: 'Thing',
				originTypeId: 'schema:Thing',
				rangeIncludes: ['URL'],
			},
		},
	],
	relationships: [
		{
			subjectClassification: 'social-media-posting',
			predicate: {
				key: 'authoredBy',
				id: '0x19e5da5af4adf03fb4d69e6910be4f17f9c612d98f150d2e9e0f3569cea304a9',
				label: 'authored by',
				description: 'The subject content was written or composed by the object actor',
				status: 'proposed',
				category: 'Authorship/Contribution',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'social-media-account',
				},
				{
					kind: 'classification',
					slug: 'person',
				},
			],
		},
		{
			subjectClassification: 'social-media-posting',
			predicate: {
				key: 'reference',
				id: '0x8cf728a7f310d0c370911dd8aed25392de51010342d688259fdf1e7193dd2ad3',
				label: 'reference',
				description:
					"The subject work cites or refers to the object work. A forward citation link — the inverse of 'cited by'",
				status: 'proposed',
				category: 'Provenance/Evidence',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'any',
					reason:
						'References can target many atom classifications; use narrower rows later where product semantics require them.',
				},
			],
		},
		{
			subjectClassification: 'social-media-posting',
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
			subjectClassification: 'social-media-posting',
			predicate: {
				key: 'hasTag',
				id: '0x0d72b37c75f5f640679c8e4743831d587b5db984edd1c6408bd3d7aa2b5b55b3',
				label: 'has tag',
				description:
					'Assigns a free-form keyword or tag atom to the subject. Use for lightweight clustering, filtering, and discovery — tags are informal, many-per-subject, and carry no taxonomy guarantees (prefer `has type` or `has category` for structured classification)',
				status: 'enshrined',
				category: 'Identity/Classification',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'defined-term',
				},
			],
		},
	],
	availableFieldCount: 137,
} as const satisfies CreationProfile;

export const creationProfile = socialMediaPostingCreationProfile;
export default socialMediaPostingCreationProfile;
