import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBakery = {
	id: 'schema:Bakery',
	name: 'Bakery',
	label: 'Bakery',
	comment: 'A bakery.',
	subClassOf: ['FoodEstablishment', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBakery;
export const Bakery = schemaOrgBakery;

export default schemaOrgBakery;
