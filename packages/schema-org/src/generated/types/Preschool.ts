import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPreschool = {
	id: 'schema:Preschool',
	name: 'Preschool',
	label: 'Preschool',
	comment: 'A preschool.',
	subClassOf: ['EducationalOrganization', 'CivicStructure', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPreschool;
export const Preschool = schemaOrgPreschool;

export default schemaOrgPreschool;
