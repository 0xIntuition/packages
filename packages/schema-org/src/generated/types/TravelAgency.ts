import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTravelAgency = {
	id: 'schema:TravelAgency',
	name: 'TravelAgency',
	label: 'TravelAgency',
	comment: 'A travel agency.',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTravelAgency;
export const TravelAgency = schemaOrgTravelAgency;

export default schemaOrgTravelAgency;
