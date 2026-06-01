import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAmusementPark = {
	id: 'schema:AmusementPark',
	name: 'AmusementPark',
	label: 'AmusementPark',
	comment: 'An amusement park.',
	subClassOf: ['EntertainmentBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAmusementPark;
export const AmusementPark = schemaOrgAmusementPark;

export default schemaOrgAmusementPark;
