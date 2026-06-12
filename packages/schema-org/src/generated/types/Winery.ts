import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWinery = {
	id: 'schema:Winery',
	name: 'Winery',
	label: 'Winery',
	comment: 'A winery.',
	subClassOf: ['FoodEstablishment', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWinery;
export const Winery = schemaOrgWinery;

export default schemaOrgWinery;
