import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSizeSystemEnumeration = {
	id: 'schema:SizeSystemEnumeration',
	name: 'SizeSystemEnumeration',
	label: 'SizeSystemEnumeration',
	comment:
		'Enumerates common size systems for different categories of products, for example "EN-13402" or "UK" for wearables or "Imperial" for screws.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSizeSystemEnumeration;
export const SizeSystemEnumeration = schemaOrgSizeSystemEnumeration;

export default schemaOrgSizeSystemEnumeration;
