import type { CreationProfile } from '../../creation-profile.js';

export const jobPostingCreationProfile = {
	classification: {
		slug: 'job-posting',
		type: 'JobPosting',
		displayName: 'Job Posting',
		description: 'A job opening with title and hiring organization as the durable identity.',
		category: 'Other',
		schema: {
			context: 'https://schema.org/',
			type: 'JobPosting',
		},
	},
	fields: [
		{
			key: 'title',
			label: 'Job Title',
			description: 'The title of the role.',
			fieldType: 'string',
			required: true,
			placeholder: 'Senior Protocol Engineer',
			schemaProperty: 'title',
			schema: {
				context: 'https://schema.org/',
				property: 'title',
				propertyId: 'schema:title',
				label: 'title',
				comment: 'The title of the job.',
				originType: 'JobPosting',
				originTypeId: 'schema:JobPosting',
				rangeIncludes: ['Text'],
			},
		},
		{
			key: 'hiringOrganization',
			label: 'Hiring Organization',
			description: 'The organization hiring for the role.',
			fieldType: 'string',
			required: true,
			placeholder: 'Intuition Labs',
			schemaProperty: 'hiringOrganization',
			schema: {
				context: 'https://schema.org/',
				property: 'hiringOrganization',
				propertyId: 'schema:hiringOrganization',
				label: 'hiringOrganization',
				comment: 'Organization or Person offering the job position.',
				originType: 'JobPosting',
				originTypeId: 'schema:JobPosting',
				rangeIncludes: ['Organization', 'Person'],
			},
		},
		{
			key: 'jobLocation',
			label: 'Job Location',
			description: 'The location of the role if needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Remote',
			schemaProperty: 'jobLocation',
			schema: {
				context: 'https://schema.org/',
				property: 'jobLocation',
				propertyId: 'schema:jobLocation',
				label: 'jobLocation',
				comment: 'A (typically single) geographic location associated with the job position.',
				originType: 'JobPosting',
				originTypeId: 'schema:JobPosting',
				rangeIncludes: ['Place'],
			},
		},
		{
			key: 'datePosted',
			label: 'Date Posted',
			description: 'The date the job was posted.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2026-02-26',
			schemaProperty: 'datePosted',
			schema: {
				context: 'https://schema.org/',
				property: 'datePosted',
				propertyId: 'schema:datePosted',
				label: 'datePosted',
				comment: 'Publication date of an online listing.',
				originType: 'JobPosting',
				originTypeId: 'schema:JobPosting',
				rangeIncludes: ['Date', 'DateTime'],
			},
		},
		{
			key: 'url',
			label: 'Job URL',
			description: 'The canonical job posting URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://example.com/jobs/senior-protocol-engineer',
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
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same job posting.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/...',
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
			subjectClassification: 'job-posting',
			predicate: {
				key: 'hiringOrganization',
				id: '0x4f4e416a2d225af561b4e119c1c6141700b2367ba4083ea6a4841a8e72273be3',
				label: 'hiring organization',
				description: 'The subject job posting is offered by the object hiring organization',
				status: 'proposed',
				category: 'Affiliation/Membership',
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
			subjectClassification: 'job-posting',
			predicate: {
				key: 'jobLocation',
				id: '0x5ff8390f622a4bf6a22f3108f2879c53255ff874e6699d70b03a740ee10757f0',
				label: 'job location',
				description: 'The subject job posting is located at or associated with the object place',
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
			subjectClassification: 'job-posting',
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
			subjectClassification: 'job-posting',
			predicate: {
				key: 'hasTag',
				id: '0x137f29ea8a0422c9d1003ece2e1883e916d4a106da0a897279842ffbb793229a',
				label: 'has tag',
				description:
					'Assigns a reusable tag or keyword atom to the subject for filtering, clustering, and discovery',
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
		{
			subjectClassification: 'job-posting',
			predicate: {
				key: 'sameAs',
				id: '0x1908b7994ca437c84c67a4799ae710355591790a726bf5890277f3aa70828c0a',
				label: 'same as',
				description:
					'Declares that the subject and object refer to the same real-world entity across different representations or naming systems',
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
	availableFieldCount: 51,
} as const satisfies CreationProfile;

export const creationProfile = jobPostingCreationProfile;
export default jobPostingCreationProfile;
