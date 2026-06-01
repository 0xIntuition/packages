import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHealthAndBeautyBusiness = {
	id: 'schema:HealthAndBeautyBusiness',
	name: 'HealthAndBeautyBusiness',
	label: 'HealthAndBeautyBusiness',
	comment: 'Health and beauty.',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHealthAndBeautyBusiness;
export const HealthAndBeautyBusiness = schemaOrgHealthAndBeautyBusiness;

export default schemaOrgHealthAndBeautyBusiness;
