import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSportsActivityLocation = {
	id: 'schema:SportsActivityLocation',
	name: 'SportsActivityLocation',
	label: 'SportsActivityLocation',
	comment: 'A sports location, such as a playing field.',
	subClassOf: ['LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSportsActivityLocation;
export const SportsActivityLocation = schemaOrgSportsActivityLocation;

export default schemaOrgSportsActivityLocation;
