import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgComputerStore = {
	id: 'schema:ComputerStore',
	name: 'ComputerStore',
	label: 'ComputerStore',
	comment: 'A computer store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgComputerStore;
export const ComputerStore = schemaOrgComputerStore;

export default schemaOrgComputerStore;
