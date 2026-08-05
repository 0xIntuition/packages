import type { ClassificationSpec } from '../../types.js';

export const jobPosting: ClassificationSpec = {
	slug: 'job-posting',
	type: 'JobPosting',
	displayName: 'Job Posting',
	description: 'A job opening with title and hiring organization as the durable identity.',
	category: 'Other',
	schema: { context: 'https://schema.org/', type: 'JobPosting' },
	metadataPredicates: ['hiringOrganization', 'jobLocation', 'url', 'hasTag', 'sameAs'] as const,
	fields: [
		{
			key: 'title',
			schemaProperty: 'title',
			label: 'Job Title',
			description: 'The title of the role.',
			fieldType: 'string',
			required: true,
			placeholder: 'Senior Protocol Engineer',
		},
		{
			key: 'hiringOrganization',
			schemaProperty: 'hiringOrganization',
			label: 'Hiring Organization',
			description: 'The organization hiring for the role.',
			fieldType: 'string',
			required: true,
			placeholder: 'Intuition Labs',
		},
		{
			key: 'jobLocation',
			schemaProperty: 'jobLocation',
			label: 'Job Location',
			description: 'The location of the role if needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Remote',
		},
		{
			key: 'datePosted',
			schemaProperty: 'datePosted',
			label: 'Date Posted',
			description: 'The date the job was posted.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2026-02-26',
		},
		{
			key: 'url',
			schemaProperty: 'url',
			label: 'Job URL',
			description: 'The canonical job posting URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://example.com/jobs/senior-protocol-engineer',
		},
		{
			key: 'sameAs',
			schemaProperty: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same job posting.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/...',
		},
	],
	defaults: { pluginId: 'job-posting', provider: 'opengraph' },
	identity: {
		identifies: 'one posting',
		ladder: [
			{ kind: 'scheme', scheme: 'url', source: { kind: 'field', key: 'url' } },
			// D21: hiringOrganization omitted — employer linkage is a triple
			{
				kind: 'gen1',
				tag: 2,
				recipe: [
					{ key: 'title', from: 'field' },
					{ key: 'datePosted', from: 'field' },
				],
			},
			{ kind: 'gen1', tag: 3, recipe: [{ key: 'title', from: 'field' }] },
		],
	},
};
