import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBikeStore = {
	id: 'schema:BikeStore',
	name: 'BikeStore',
	label: 'BikeStore',
	comment: 'A bike store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBikeStore;
export const BikeStore = schemaOrgBikeStore;

export default schemaOrgBikeStore;
