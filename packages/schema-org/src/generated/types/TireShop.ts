import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTireShop = {
	id: 'schema:TireShop',
	name: 'TireShop',
	label: 'TireShop',
	comment: 'A tire shop.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTireShop;
export const TireShop = schemaOrgTireShop;

export default schemaOrgTireShop;
