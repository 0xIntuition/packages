import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgNightClub = {
	id: 'schema:NightClub',
	name: 'NightClub',
	label: 'NightClub',
	comment: 'A nightclub or discotheque.',
	subClassOf: ['EntertainmentBusiness', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgNightClub;
export const NightClub = schemaOrgNightClub;

export default schemaOrgNightClub;
