import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgConvenienceStore = {
	id: 'schema:ConvenienceStore',
	name: 'ConvenienceStore',
	label: 'ConvenienceStore',
	comment: 'A convenience store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgConvenienceStore;
export const ConvenienceStore = schemaOrgConvenienceStore;

export default schemaOrgConvenienceStore;
