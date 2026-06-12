import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSportsClub = {
	id: 'schema:SportsClub',
	name: 'SportsClub',
	label: 'SportsClub',
	comment: 'A sports club.',
	subClassOf: ['SportsActivityLocation', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSportsClub;
export const SportsClub = schemaOrgSportsClub;

export default schemaOrgSportsClub;
