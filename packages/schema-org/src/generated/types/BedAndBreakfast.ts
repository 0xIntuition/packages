import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBedAndBreakfast = {
	id: 'schema:BedAndBreakfast',
	name: 'BedAndBreakfast',
	label: 'BedAndBreakfast',
	comment:
		'Bed and breakfast.\n<br /><br />\nSee also the <a href="/docs/hotels.html">dedicated document on the use of schema.org for marking up hotels and other forms of accommodations</a>.\n',
	subClassOf: ['LodgingBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBedAndBreakfast;
export const BedAndBreakfast = schemaOrgBedAndBreakfast;

export default schemaOrgBedAndBreakfast;
