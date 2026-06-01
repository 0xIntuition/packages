import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgStadiumOrArena = {
	id: 'schema:StadiumOrArena',
	name: 'StadiumOrArena',
	label: 'StadiumOrArena',
	comment: 'A stadium.',
	subClassOf: [
		'CivicStructure',
		'Place',
		'Thing',
		'SportsActivityLocation',
		'LocalBusiness',
		'Organization',
	],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgStadiumOrArena;
export const StadiumOrArena = schemaOrgStadiumOrArena;

export default schemaOrgStadiumOrArena;
