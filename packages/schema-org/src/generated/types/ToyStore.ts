import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgToyStore = {
	id: 'schema:ToyStore',
	name: 'ToyStore',
	label: 'ToyStore',
	comment: 'A toy store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgToyStore;
export const ToyStore = schemaOrgToyStore;

export default schemaOrgToyStore;
