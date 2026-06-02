import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgJewelryStore = {
	id: 'schema:JewelryStore',
	name: 'JewelryStore',
	label: 'JewelryStore',
	comment: 'A jewelry store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgJewelryStore;
export const JewelryStore = schemaOrgJewelryStore;

export default schemaOrgJewelryStore;
