import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOutletStore = {
	id: 'schema:OutletStore',
	name: 'OutletStore',
	label: 'OutletStore',
	comment: 'An outlet store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOutletStore;
export const OutletStore = schemaOrgOutletStore;

export default schemaOrgOutletStore;
