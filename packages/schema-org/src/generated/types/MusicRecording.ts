import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMusicRecording = {
	id: 'schema:MusicRecording',
	name: 'MusicRecording',
	label: 'MusicRecording',
	comment: 'A music recording (track), usually a single song.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:byArtist',
			name: 'byArtist',
			label: 'byArtist',
			comment: 'The artist that performed this album or recording.',
			rangeIncludes: ['MusicGroup', 'Person'],
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
			id: 'schema:inAlbum',
			name: 'inAlbum',
			label: 'inAlbum',
			comment: 'The album to which this recording belongs.',
			rangeIncludes: ['MusicAlbum'],
		},
		{
			id: 'schema:inPlaylist',
			name: 'inPlaylist',
			label: 'inPlaylist',
			comment: 'The playlist to which this recording belongs.',
			rangeIncludes: ['MusicPlaylist'],
		},
		{
			id: 'schema:isrcCode',
			name: 'isrcCode',
			label: 'isrcCode',
			comment: 'The International Standard Recording Code for the recording.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:recordingOf',
			name: 'recordingOf',
			label: 'recordingOf',
			comment: 'The composition this track is a recording of.',
			rangeIncludes: ['MusicComposition'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMusicRecording;
export const MusicRecording = schemaOrgMusicRecording;

export default schemaOrgMusicRecording;
