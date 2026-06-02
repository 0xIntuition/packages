import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGardenStore = {
	id: 'schema:GardenStore',
	name: 'GardenStore',
	label: 'GardenStore',
	comment: 'A garden store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGardenStore;
export const GardenStore = schemaOrgGardenStore;

export default schemaOrgGardenStore;
