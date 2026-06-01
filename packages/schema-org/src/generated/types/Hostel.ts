import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHostel = {
	id: 'schema:Hostel',
	name: 'Hostel',
	label: 'Hostel',
	comment:
		'A hostel - cheap accommodation, often in shared dormitories.\n<br /><br />\nSee also the <a href="/docs/hotels.html">dedicated document on the use of schema.org for marking up hotels and other forms of accommodations</a>.\n',
	subClassOf: ['LodgingBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHostel;
export const Hostel = schemaOrgHostel;

export default schemaOrgHostel;
