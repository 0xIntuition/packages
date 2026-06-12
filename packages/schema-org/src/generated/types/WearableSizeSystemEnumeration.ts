import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWearableSizeSystemEnumeration = {
	id: 'schema:WearableSizeSystemEnumeration',
	name: 'WearableSizeSystemEnumeration',
	label: 'WearableSizeSystemEnumeration',
	comment: 'Enumerates common size systems specific for wearable products.',
	subClassOf: ['SizeSystemEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWearableSizeSystemEnumeration;
export const WearableSizeSystemEnumeration = schemaOrgWearableSizeSystemEnumeration;

export default schemaOrgWearableSizeSystemEnumeration;
