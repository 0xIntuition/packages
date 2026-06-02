import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMiddleSchool = {
	id: 'schema:MiddleSchool',
	name: 'MiddleSchool',
	label: 'MiddleSchool',
	comment:
		'A middle school (typically for children aged around 11-14, although this varies somewhat).',
	subClassOf: ['EducationalOrganization', 'CivicStructure', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMiddleSchool;
export const MiddleSchool = schemaOrgMiddleSchool;

export default schemaOrgMiddleSchool;
