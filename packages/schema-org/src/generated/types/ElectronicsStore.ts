import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgElectronicsStore = {
	id: 'schema:ElectronicsStore',
	name: 'ElectronicsStore',
	label: 'ElectronicsStore',
	comment: 'An electronics store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgElectronicsStore;
export const ElectronicsStore = schemaOrgElectronicsStore;

export default schemaOrgElectronicsStore;
