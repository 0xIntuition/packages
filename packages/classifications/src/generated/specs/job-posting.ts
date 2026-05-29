import type { ClassificationSpec } from '../../types.js';

export const jobPosting: ClassificationSpec = {
	slug: 'job-posting',
	type: 'JobPosting',
	displayName: 'Job Posting',
	description: 'A job opening with title and hiring organization as the durable identity.',
	category: 'Other',
	schemaOrg: { context: 'https://schema.org/', type: 'JobPosting' },
	fields: [
		{
			key: 'title',
			label: 'Job Title',
			description: 'The title of the role.',
			fieldType: 'string',
			required: true,
			placeholder: 'Senior Protocol Engineer',
		},
		{
			key: 'hiringOrganization',
			label: 'Hiring Organization',
			description: 'The organization hiring for the role.',
			fieldType: 'string',
			required: true,
			placeholder: 'Intuition Labs',
		},
		{
			key: 'jobLocation',
			label: 'Job Location',
			description: 'The location of the role if needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Remote',
		},
		{
			key: 'datePosted',
			label: 'Date Posted',
			description: 'The date the job was posted.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2026-02-26',
		},
		{
			key: 'url',
			label: 'Job URL',
			description: 'The canonical job posting URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://example.com/jobs/senior-protocol-engineer',
		},
	],
	defaults: { pluginId: 'job-posting', provider: 'opengraph' },
};
