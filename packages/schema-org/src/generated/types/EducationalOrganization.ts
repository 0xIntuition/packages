import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEducationalOrganization = {
	id: 'schema:EducationalOrganization',
	name: 'EducationalOrganization',
	label: 'EducationalOrganization',
	comment: 'An educational organization.',
	subClassOf: ['CivicStructure', 'Organization', 'Place', 'Thing'],
	properties: [
		{
			id: 'schema:alumni',
			name: 'alumni',
			label: 'alumni',
			comment: 'Alumni of an organization.',
			rangeIncludes: ['Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEducationalOrganization;
export const EducationalOrganization = schemaOrgEducationalOrganization;

export default schemaOrgEducationalOrganization;
