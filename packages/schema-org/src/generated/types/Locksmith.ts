import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLocksmith = {
	id: 'schema:Locksmith',
	name: 'Locksmith',
	label: 'Locksmith',
	comment: 'A locksmith.',
	subClassOf: ['HomeAndConstructionBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLocksmith;
export const Locksmith = schemaOrgLocksmith;

export default schemaOrgLocksmith;
