import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgComicCoverArt = {
	id: 'schema:ComicCoverArt',
	name: 'ComicCoverArt',
	label: 'ComicCoverArt',
	comment: 'The artwork on the cover of a comic.',
	subClassOf: ['ComicStory', 'CreativeWork', 'Thing', 'CoverArt', 'VisualArtwork'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgComicCoverArt;
export const ComicCoverArt = schemaOrgComicCoverArt;

export default schemaOrgComicCoverArt;
