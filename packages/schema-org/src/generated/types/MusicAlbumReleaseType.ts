import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMusicAlbumReleaseType = {
	id: 'schema:MusicAlbumReleaseType',
	name: 'MusicAlbumReleaseType',
	label: 'MusicAlbumReleaseType',
	comment: 'The kind of release which this album is: single, EP or album.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMusicAlbumReleaseType;
export const MusicAlbumReleaseType = schemaOrgMusicAlbumReleaseType;

export default schemaOrgMusicAlbumReleaseType;
