import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCollegeOrUniversity = {
	id: 'schema:CollegeOrUniversity',
	name: 'CollegeOrUniversity',
	label: 'CollegeOrUniversity',
	comment: 'A college, university, or other third-level educational institution.',
	subClassOf: ['EducationalOrganization', 'CivicStructure', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCollegeOrUniversity;
export const CollegeOrUniversity = schemaOrgCollegeOrUniversity;

export default schemaOrgCollegeOrUniversity;
