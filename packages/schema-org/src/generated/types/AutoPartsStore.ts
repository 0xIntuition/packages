import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAutoPartsStore = {
	id: 'schema:AutoPartsStore',
	name: 'AutoPartsStore',
	label: 'AutoPartsStore',
	comment: 'An auto parts store.',
	subClassOf: ['AutomotiveBusiness', 'Store', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAutoPartsStore;
export const AutoPartsStore = schemaOrgAutoPartsStore;

export default schemaOrgAutoPartsStore;
