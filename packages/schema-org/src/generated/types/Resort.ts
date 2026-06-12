import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgResort = {
	id: 'schema:Resort',
	name: 'Resort',
	label: 'Resort',
	comment:
		'A resort is a place used for relaxation or recreation, attracting visitors for holidays or vacations. Resorts are places, towns or sometimes commercial establishments operated by a single company (source: Wikipedia, the free encyclopedia, see <a href="http://en.wikipedia.org/wiki/Resort">http://en.wikipedia.org/wiki/Resort</a>).\n<br /><br />\nSee also the <a href="/docs/hotels.html">dedicated document on the use of schema.org for marking up hotels and other forms of accommodations</a>.\n    ',
	subClassOf: ['LodgingBusiness', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgResort;
export const Resort = schemaOrgResort;

export default schemaOrgResort;
