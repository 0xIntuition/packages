import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSchool = {
	id: 'schema:School',
	name: 'School',
	label: 'School',
	comment: 'A school.',
	subClassOf: ['EducationalOrganization', 'CivicStructure', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSchool;
export const School = schemaOrgSchool;

export default schemaOrgSchool;
