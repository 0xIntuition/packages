import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPoster = {
	id: 'schema:Poster',
	name: 'Poster',
	label: 'Poster',
	comment:
		'A large, usually printed placard, bill, or announcement, often illustrated, that is posted to advertise or publicize something.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPoster;
export const Poster = schemaOrgPoster;

export default schemaOrgPoster;
