import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgNailSalon = {
	id: 'schema:NailSalon',
	name: 'NailSalon',
	label: 'NailSalon',
	comment: 'A nail salon.',
	subClassOf: ['HealthAndBeautyBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgNailSalon;
export const NailSalon = schemaOrgNailSalon;

export default schemaOrgNailSalon;
