import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGenderType = {
	id: 'schema:GenderType',
	name: 'GenderType',
	label: 'GenderType',
	comment: 'An enumeration of genders.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGenderType;
export const GenderType = schemaOrgGenderType;

export default schemaOrgGenderType;
