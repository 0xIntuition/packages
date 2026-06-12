import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMensClothingStore = {
	id: 'schema:MensClothingStore',
	name: 'MensClothingStore',
	label: 'MensClothingStore',
	comment: "A men's clothing store.",
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMensClothingStore;
export const MensClothingStore = schemaOrgMensClothingStore;

export default schemaOrgMensClothingStore;
