import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMotel = {
	id: 'schema:Motel',
	name: 'Motel',
	label: 'Motel',
	comment:
		'A motel.\n<br /><br />\nSee also the <a href="/docs/hotels.html">dedicated document on the use of schema.org for marking up hotels and other forms of accommodations</a>.\n',
	subClassOf: ['LodgingBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMotel;
export const Motel = schemaOrgMotel;

export default schemaOrgMotel;
