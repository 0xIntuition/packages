import type { CreationProfile } from '../../creation-profile.js';

export const commentCreationProfile = {
	classification: {
		slug: 'comment',
		type: 'Comment',
		displayName: 'Comment',
		description: 'A minimal comment identity linked to a stable target.',
		category: 'Creative Work',
		schema: {
			context: 'https://schema.org/',
			type: 'Comment',
		},
	},
	fields: [
		{
			key: 'text',
			label: 'Comment Text',
			description: 'The text body of the comment.',
			fieldType: 'string',
			required: true,
			placeholder: 'This launch thread is incredibly useful.',
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
			key: 'about',
			label: 'Target',
			description: 'The target identifier or URL the comment is about.',
			fieldType: 'string',
			required: false,
			placeholder: 'https://example.com/posts/launch-thread',
			schemaProperty: 'about',
			schema: {
				context: 'https://schema.org/',
				property: 'about',
				propertyId: 'schema:about',
				label: 'about',
				comment: 'The subject matter of an object.',
				originType: 'CreativeWork',
				originTypeId: 'schema:CreativeWork',
				rangeIncludes: ['Thing'],
			},
		},
		{
			key: 'dateCreated',
			label: 'Date Created',
			description: 'The date the comment was created.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2026-02-26',
			schemaProperty: 'dateCreated',
			schema: {
				context: 'https://schema.org/',
				property: 'dateCreated',
				propertyId: 'schema:dateCreated',
				label: 'dateCreated',
				comment:
					'The date on which the CreativeWork was created or the item was added to a DataFeed.',
				originType: 'CreativeWork',
				originTypeId: 'schema:CreativeWork',
				rangeIncludes: ['Date', 'DateTime'],
			},
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same comment.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/posts/launch-thread#comment-42',
			schemaProperty: 'sameAs',
			schema: {
				context: 'https://schema.org/',
				property: 'sameAs',
				propertyId: 'schema:sameAs',
				label: 'sameAs',
				comment:
					"URL of a reference Web page that unambiguously indicates the item's identity. E.g. the URL of the item's Wikipedia page, Wikidata entry, or official website.",
				originType: 'Thing',
				originTypeId: 'schema:Thing',
				rangeIncludes: ['URL'],
			},
		},
	],
	relationships: [
		{
			subjectClassification: 'comment',
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
					slug: 'person',
				},
			],
		},
		{
			subjectClassification: 'comment',
			predicate: {
				key: 'parentItem',
				id: '0x26cb448e9daa4e54f247033c2b40741153f1b2b8ae2bd13033920c389314ee36',
				label: 'parent item',
				description: 'The subject comment or item is a reply to or child of the object item',
				status: 'proposed',
				category: 'Curation/Containment',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'comment',
				},
				{
					kind: 'any',
					reason:
						'References can target many atom classifications; use narrower rows later where product semantics require them.',
				},
			],
		},
		{
			subjectClassification: 'comment',
			predicate: {
				key: 'sameAs',
				id: '0x13fa59de1639343483dd3c864cf585b571fe43b67e0ce9c2335a803c4e8f7348',
				label: 'same as',
				description:
					'Declares that the subject and object refer to the same real-world entity across representations, naming systems, or aliases. Symmetric and transitive — use for identity resolution, duplicate collapsing, and alternate-name mapping',
				status: 'enshrined',
				category: 'Identity/Classification',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'same-classification',
				},
			],
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'sameAs',
					match: 'exact',
				},
			],
			priority: 'recommended',
			notes: 'Use for strict identity links only between atoms with the same classification.',
		},
	],
	availableFieldCount: 133,
} as const satisfies CreationProfile;

export const creationProfile = commentCreationProfile;
export default commentCreationProfile;
