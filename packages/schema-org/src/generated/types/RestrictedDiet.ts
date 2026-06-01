import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRestrictedDiet = {
	id: 'schema:RestrictedDiet',
	name: 'RestrictedDiet',
	label: 'RestrictedDiet',
	comment:
		'A diet restricted to certain foods or preparations for cultural, religious, health or lifestyle reasons. ',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRestrictedDiet;
export const RestrictedDiet = schemaOrgRestrictedDiet;

export default schemaOrgRestrictedDiet;
