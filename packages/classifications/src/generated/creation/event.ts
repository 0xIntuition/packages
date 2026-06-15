import type { CreationProfile } from '../../creation-profile.js';

export const eventCreationProfile = {
	classification: {
		slug: 'event',
		type: 'Event',
		displayName: 'Event',
		description: 'An event identity with optional time and location disambiguators.',
		category: 'Other',
		schema: {
			context: 'https://schema.org/',
			type: 'Event',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Event Name',
			description: 'The name of the event.',
			fieldType: 'string',
			required: true,
			placeholder: 'ETHDenver 2026',
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
			key: 'startDate',
			label: 'Start Date',
			description: 'The event start date.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2026-02-26',
			schemaProperty: 'startDate',
			schema: {
				context: 'https://schema.org/',
				property: 'startDate',
				propertyId: 'schema:startDate',
				label: 'startDate',
				comment:
					'The start date and time of the item (in [ISO 8601 date format](http://en.wikipedia.org/wiki/ISO_8601)).',
				originType: 'Event',
				originTypeId: 'schema:Event',
				rangeIncludes: ['Date', 'DateTime'],
			},
		},
		{
			key: 'location',
			label: 'Location',
			description: 'The location name when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Denver, Colorado',
			schemaProperty: 'location',
			schema: {
				context: 'https://schema.org/',
				property: 'location',
				propertyId: 'schema:location',
				label: 'location',
				comment:
					'The location of, for example, where an event is happening, where an organization is located, or where an action takes place.',
				originType: 'Event',
				originTypeId: 'schema:Event',
				rangeIncludes: ['Place', 'PostalAddress', 'Text', 'VirtualLocation'],
			},
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same event.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://www.ethdenver.com',
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
			subjectClassification: 'event',
			predicate: {
				key: 'organizer',
				id: '0xfd41828cda1bfc93e82b9c99488e9a8de74496a195c67ae7419facae3c41c12f',
				label: 'organizer',
				description: 'The subject event is organized by the object person or organization',
				status: 'proposed',
				category: 'Affiliation/Membership',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'person',
				},
				{
					kind: 'classification',
					slug: 'company',
				},
			],
		},
		{
			subjectClassification: 'event',
			predicate: {
				key: 'performer',
				id: '0xfcf209b610d68918af7dac25c3d568eb769af4d71e9f750caec0e25679a6adb2',
				label: 'performer',
				description: 'The subject event or creative work includes the object performer',
				status: 'proposed',
				category: 'Authorship/Contribution',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'person',
				},
				{
					kind: 'classification',
					slug: 'music-group',
				},
				{
					kind: 'classification',
					slug: 'company',
				},
			],
		},
		{
			subjectClassification: 'event',
			predicate: {
				key: 'sponsoredBy',
				id: '0x80d43f1c53058ddeba0daea68c239900133bc08ff1dec845c424190ff36c5f9e',
				label: 'sponsored by',
				description:
					'The subject event, project, or initiative receives financial sponsorship from the object entity',
				status: 'proposed',
				category: 'Economic/Market',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'company',
				},
			],
		},
		{
			subjectClassification: 'event',
			predicate: {
				key: 'subEvent',
				id: '0xcd49e0f14c378b8156a4b9cc583ae5bd539491c38e17be66285b08fd63be9c2f',
				label: 'sub event',
				description: 'The subject event contains the object event as a sub-event',
				status: 'proposed',
				category: 'Curation/Containment',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'event',
				},
			],
		},
		{
			subjectClassification: 'event',
			predicate: {
				key: 'superEvent',
				id: '0x7fdbe6f3dfdb1c26fb35f3fcd265d7962bc25f1a18b32fec1c2d65d5897495fe',
				label: 'super event',
				description: 'The subject event is part of the object event',
				status: 'proposed',
				category: 'Curation/Containment',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'event',
				},
			],
		},
		{
			subjectClassification: 'event',
			predicate: {
				key: 'locatedIn',
				id: '0x165f0f2f51314106e280a6e6a828dda617322e7ee861dfcdad42f3f1faf7c781',
				label: 'located in',
				description:
					'Asserts that the subject is geographically or logically situated within the object location',
				status: 'proposed',
				category: 'Metadata/Linking',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'location',
				},
			],
		},
		{
			subjectClassification: 'event',
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
	availableFieldCount: 56,
} as const satisfies CreationProfile;

export const creationProfile = eventCreationProfile;
export default eventCreationProfile;
