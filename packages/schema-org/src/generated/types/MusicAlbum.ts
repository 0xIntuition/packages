import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMusicAlbum = {
	id: 'schema:MusicAlbum',
	name: 'MusicAlbum',
	label: 'MusicAlbum',
	comment: 'A collection of music tracks.',
	subClassOf: ['MusicPlaylist', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:albumProductionType',
			name: 'albumProductionType',
			label: 'albumProductionType',
			comment:
				'Classification of the album by its type of content: soundtrack, live album, studio album, etc.',
			rangeIncludes: ['MusicAlbumProductionType'],
		},
		{
			id: 'schema:albumRelease',
			name: 'albumRelease',
			label: 'albumRelease',
			comment: 'A release of this album.',
			rangeIncludes: ['MusicRelease'],
		},
		{
			id: 'schema:albumReleaseType',
			name: 'albumReleaseType',
			label: 'albumReleaseType',
			comment: 'The kind of release which this album is: single, EP or album.',
			rangeIncludes: ['MusicAlbumReleaseType'],
		},
		{
			id: 'schema:byArtist',
			name: 'byArtist',
			label: 'byArtist',
			comment: 'The artist that performed this album or recording.',
			rangeIncludes: ['MusicGroup', 'Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMusicAlbum;
export const MusicAlbum = schemaOrgMusicAlbum;

export default schemaOrgMusicAlbum;
