import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgComedyClub = {
	id: 'schema:ComedyClub',
	name: 'ComedyClub',
	label: 'ComedyClub',
	comment: 'A comedy club.',
	subClassOf: ['EntertainmentBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgComedyClub;
export const ComedyClub = schemaOrgComedyClub;

export default schemaOrgComedyClub;
