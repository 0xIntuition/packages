import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHotel = {
	id: 'schema:Hotel',
	name: 'Hotel',
	label: 'Hotel',
	comment:
		'A hotel is an establishment that provides lodging paid on a short-term basis (source: Wikipedia, the free encyclopedia, see http://en.wikipedia.org/wiki/Hotel).\n<br /><br />\nSee also the <a href="/docs/hotels.html">dedicated document on the use of schema.org for marking up hotels and other forms of accommodations</a>.\n',
	subClassOf: ['LodgingBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHotel;
export const Hotel = schemaOrgHotel;

export default schemaOrgHotel;
