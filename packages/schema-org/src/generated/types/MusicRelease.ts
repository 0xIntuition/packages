import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMusicRelease = {
	id: 'schema:MusicRelease',
	name: 'MusicRelease',
	label: 'MusicRelease',
	comment: 'A MusicRelease is a specific release of a music album.',
	subClassOf: ['MusicPlaylist', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:catalogNumber',
			name: 'catalogNumber',
			label: 'catalogNumber',
			comment: 'The catalog number for the release.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:creditedTo',
			name: 'creditedTo',
			label: 'creditedTo',
			comment:
				'The group the release is credited to if different than the byArtist. For example, Red and Blue is credited to "Stefani Germanotta Band", but by Lady Gaga.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:duration',
			name: 'duration',
			label: 'duration',
			comment:
				'The duration of the item (movie, audio recording, event, etc.) in [ISO 8601 duration format](http://en.wikipedia.org/wiki/ISO_8601).',
			rangeIncludes: ['Duration', 'QuantitativeValue'],
		},
		{
			id: 'schema:musicReleaseFormat',
			name: 'musicReleaseFormat',
			label: 'musicReleaseFormat',
			comment:
				'Format of this release (the type of recording media used, i.e. compact disc, digital media, LP, etc.).',
			rangeIncludes: ['MusicReleaseFormatType'],
		},
		{
			id: 'schema:recordLabel',
			name: 'recordLabel',
			label: 'recordLabel',
			comment: 'The label that issued the release.',
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:releaseOf',
			name: 'releaseOf',
			label: 'releaseOf',
			comment: 'The album this is a release of.',
			rangeIncludes: ['MusicAlbum'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMusicRelease;
export const MusicRelease = schemaOrgMusicRelease;

export default schemaOrgMusicRelease;
