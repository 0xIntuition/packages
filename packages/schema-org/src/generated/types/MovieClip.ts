import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMovieClip = {
	id: 'schema:MovieClip',
	name: 'MovieClip',
	label: 'MovieClip',
	comment: 'A short segment/part of a movie.',
	subClassOf: ['Clip', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMovieClip;
export const MovieClip = schemaOrgMovieClip;

export default schemaOrgMovieClip;
