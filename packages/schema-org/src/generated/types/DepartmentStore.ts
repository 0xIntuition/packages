import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDepartmentStore = {
	id: 'schema:DepartmentStore',
	name: 'DepartmentStore',
	label: 'DepartmentStore',
	comment: 'A department store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDepartmentStore;
export const DepartmentStore = schemaOrgDepartmentStore;

export default schemaOrgDepartmentStore;
