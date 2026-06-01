import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMusicPlaylist = {
	id: 'schema:MusicPlaylist',
	name: 'MusicPlaylist',
	label: 'MusicPlaylist',
	comment: 'A collection of music tracks in playlist form.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:numTracks',
			name: 'numTracks',
			label: 'numTracks',
			comment: 'The number of tracks in this album or playlist.',
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:track',
			name: 'track',
			label: 'track',
			comment:
				'A music recording (track)&#x2014;usually a single song. If an ItemList is given, the list should contain items of type MusicRecording.',
			rangeIncludes: ['ItemList', 'MusicRecording'],
		},
		{
			id: 'schema:tracks',
			name: 'tracks',
			label: 'tracks',
			comment: 'A music recording (track)&#x2014;usually a single song.',
			rangeIncludes: ['MusicRecording'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMusicPlaylist;
export const MusicPlaylist = schemaOrgMusicPlaylist;

export default schemaOrgMusicPlaylist;
