import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSchoolDistrict = {
	id: 'schema:SchoolDistrict',
	name: 'SchoolDistrict',
	label: 'SchoolDistrict',
	comment: 'A School District is an administrative area for the administration of schools.',
	subClassOf: ['AdministrativeArea', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSchoolDistrict;
export const SchoolDistrict = schemaOrgSchoolDistrict;

export default schemaOrgSchoolDistrict;
