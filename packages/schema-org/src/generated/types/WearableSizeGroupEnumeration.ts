import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWearableSizeGroupEnumeration = {
	id: 'schema:WearableSizeGroupEnumeration',
	name: 'WearableSizeGroupEnumeration',
	label: 'WearableSizeGroupEnumeration',
	comment: 'Enumerates common size groups (also known as "size types") for wearable products.',
	subClassOf: ['SizeGroupEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWearableSizeGroupEnumeration;
export const WearableSizeGroupEnumeration = schemaOrgWearableSizeGroupEnumeration;

export default schemaOrgWearableSizeGroupEnumeration;
