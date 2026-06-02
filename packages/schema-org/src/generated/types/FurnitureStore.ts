import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFurnitureStore = {
	id: 'schema:FurnitureStore',
	name: 'FurnitureStore',
	label: 'FurnitureStore',
	comment: 'A furniture store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFurnitureStore;
export const FurnitureStore = schemaOrgFurnitureStore;

export default schemaOrgFurnitureStore;
