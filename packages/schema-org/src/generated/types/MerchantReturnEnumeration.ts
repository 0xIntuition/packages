import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMerchantReturnEnumeration = {
	id: 'schema:MerchantReturnEnumeration',
	name: 'MerchantReturnEnumeration',
	label: 'MerchantReturnEnumeration',
	comment: 'Enumerates several kinds of product return policies.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMerchantReturnEnumeration;
export const MerchantReturnEnumeration = schemaOrgMerchantReturnEnumeration;

export default schemaOrgMerchantReturnEnumeration;
