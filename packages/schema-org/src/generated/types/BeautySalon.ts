import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBeautySalon = {
	id: 'schema:BeautySalon',
	name: 'BeautySalon',
	label: 'BeautySalon',
	comment: 'Beauty salon.',
	subClassOf: ['HealthAndBeautyBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBeautySalon;
export const BeautySalon = schemaOrgBeautySalon;

export default schemaOrgBeautySalon;
