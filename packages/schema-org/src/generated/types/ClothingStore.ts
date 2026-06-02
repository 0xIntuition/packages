import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgClothingStore = {
	id: 'schema:ClothingStore',
	name: 'ClothingStore',
	label: 'ClothingStore',
	comment: 'A clothing store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgClothingStore;
export const ClothingStore = schemaOrgClothingStore;

export default schemaOrgClothingStore;
