import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFilmAction = {
	id: 'schema:FilmAction',
	name: 'FilmAction',
	label: 'FilmAction',
	comment: 'The act of capturing sound and moving images on film, video, or digitally.',
	subClassOf: ['CreateAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFilmAction;
export const FilmAction = schemaOrgFilmAction;

export default schemaOrgFilmAction;
