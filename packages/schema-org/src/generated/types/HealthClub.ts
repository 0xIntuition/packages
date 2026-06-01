import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHealthClub = {
	id: 'schema:HealthClub',
	name: 'HealthClub',
	label: 'HealthClub',
	comment: 'A health club.',
	subClassOf: [
		'HealthAndBeautyBusiness',
		'LocalBusiness',
		'Organization',
		'Thing',
		'Place',
		'SportsActivityLocation',
	],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHealthClub;
export const HealthClub = schemaOrgHealthClub;

export default schemaOrgHealthClub;
