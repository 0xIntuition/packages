import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHairSalon = {
	id: 'schema:HairSalon',
	name: 'HairSalon',
	label: 'HairSalon',
	comment: 'A hair salon.',
	subClassOf: ['HealthAndBeautyBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHairSalon;
export const HairSalon = schemaOrgHairSalon;

export default schemaOrgHairSalon;
