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
		{
			subjectClassification: 'job-posting',
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
	availableFieldCount: 51,
} as const satisfies CreationProfile;

export const creationProfile = jobPostingCreationProfile;
export default jobPostingCreationProfile;
