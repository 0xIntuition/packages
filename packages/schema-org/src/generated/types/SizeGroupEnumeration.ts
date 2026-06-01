import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSizeGroupEnumeration = {
	id: 'schema:SizeGroupEnumeration',
	name: 'SizeGroupEnumeration',
	label: 'SizeGroupEnumeration',
	comment: 'Enumerates common size groups for various product categories.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSizeGroupEnumeration;
export const SizeGroupEnumeration = schemaOrgSizeGroupEnumeration;

export default schemaOrgSizeGroupEnumeration;
