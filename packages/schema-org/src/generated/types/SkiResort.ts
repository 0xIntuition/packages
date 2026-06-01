import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSkiResort = {
	id: 'schema:SkiResort',
	name: 'SkiResort',
	label: 'SkiResort',
	comment: 'A ski resort.',
	subClassOf: [
		'Resort',
		'LodgingBusiness',
		'LocalBusiness',
		'Organization',
		'Thing',
		'Place',
		'SportsActivityLocation',
	],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSkiResort;
export const SkiResort = schemaOrgSkiResort;

export default schemaOrgSkiResort;
