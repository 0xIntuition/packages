import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMovieRentalStore = {
	id: 'schema:MovieRentalStore',
	name: 'MovieRentalStore',
	label: 'MovieRentalStore',
	comment: 'A movie rental store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMovieRentalStore;
export const MovieRentalStore = schemaOrgMovieRentalStore;

export default schemaOrgMovieRentalStore;
