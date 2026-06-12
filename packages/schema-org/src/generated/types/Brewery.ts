import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBrewery = {
	id: 'schema:Brewery',
	name: 'Brewery',
	label: 'Brewery',
	comment: 'Brewery.',
	subClassOf: ['FoodEstablishment', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBrewery;
export const Brewery = schemaOrgBrewery;

export default schemaOrgBrewery;
