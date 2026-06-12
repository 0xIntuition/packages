import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHighSchool = {
	id: 'schema:HighSchool',
	name: 'HighSchool',
	label: 'HighSchool',
	comment: 'A high school.',
	subClassOf: ['EducationalOrganization', 'CivicStructure', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHighSchool;
export const HighSchool = schemaOrgHighSchool;

export default schemaOrgHighSchool;
