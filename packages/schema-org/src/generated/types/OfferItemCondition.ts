import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOfferItemCondition = {
	id: 'schema:OfferItemCondition',
	name: 'OfferItemCondition',
	label: 'OfferItemCondition',
	comment: 'A list of possible conditions for the item.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOfferItemCondition;
export const OfferItemCondition = schemaOrgOfferItemCondition;

export default schemaOrgOfferItemCondition;
