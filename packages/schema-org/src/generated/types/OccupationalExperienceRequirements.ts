import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOccupationalExperienceRequirements = {
	id: 'schema:OccupationalExperienceRequirements',
	name: 'OccupationalExperienceRequirements',
	label: 'OccupationalExperienceRequirements',
	comment: 'Indicates employment-related experience requirements, e.g. [[monthsOfExperience]].',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:monthsOfExperience',
			name: 'monthsOfExperience',
			label: 'monthsOfExperience',
			comment: 'Indicates the minimal number of months of experience required for a position.',
			rangeIncludes: ['Number'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOccupationalExperienceRequirements;
export const OccupationalExperienceRequirements = schemaOrgOccupationalExperienceRequirements;

export default schemaOrgOccupationalExperienceRequirements;
