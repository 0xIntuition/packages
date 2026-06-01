import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgContinent = {
	id: 'schema:Continent',
	name: 'Continent',
	label: 'Continent',
	comment: 'One of the continents (for example, Europe or Africa).',
	subClassOf: ['Landform', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgContinent;
export const Continent = schemaOrgContinent;

export default schemaOrgContinent;
