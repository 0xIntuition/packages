import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDaySpa = {
	id: 'schema:DaySpa',
	name: 'DaySpa',
	label: 'DaySpa',
	comment: 'A day spa.',
	subClassOf: ['HealthAndBeautyBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDaySpa;
export const DaySpa = schemaOrgDaySpa;

export default schemaOrgDaySpa;
