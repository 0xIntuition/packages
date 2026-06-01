import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAdultEntertainment = {
	id: 'schema:AdultEntertainment',
	name: 'AdultEntertainment',
	label: 'AdultEntertainment',
	comment: 'An adult entertainment establishment.',
	subClassOf: ['EntertainmentBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAdultEntertainment;
export const AdultEntertainment = schemaOrgAdultEntertainment;

export default schemaOrgAdultEntertainment;
