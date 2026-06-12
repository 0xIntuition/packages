import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEducationalAudience = {
	id: 'schema:EducationalAudience',
	name: 'EducationalAudience',
	label: 'EducationalAudience',
	comment: 'An EducationalAudience.',
	subClassOf: ['Audience', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:educationalRole',
			name: 'educationalRole',
			label: 'educationalRole',
			comment: 'An educationalRole of an EducationalAudience.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEducationalAudience;
export const EducationalAudience = schemaOrgEducationalAudience;

export default schemaOrgEducationalAudience;
