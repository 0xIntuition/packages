import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFulfillmentTypeEnumeration = {
	id: 'schema:FulfillmentTypeEnumeration',
	name: 'FulfillmentTypeEnumeration',
	label: 'FulfillmentTypeEnumeration',
	comment: 'A type of product fulfillment.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFulfillmentTypeEnumeration;
export const FulfillmentTypeEnumeration = schemaOrgFulfillmentTypeEnumeration;

export default schemaOrgFulfillmentTypeEnumeration;
