import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgElementarySchool = {
	id: 'schema:ElementarySchool',
	name: 'ElementarySchool',
	label: 'ElementarySchool',
	comment: 'An elementary school.',
	subClassOf: ['EducationalOrganization', 'CivicStructure', 'Place', 'Thing', 'Organization'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgElementarySchool;
export const ElementarySchool = schemaOrgElementarySchool;

export default schemaOrgElementarySchool;
