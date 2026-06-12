import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMusicGroup = {
	id: 'schema:MusicGroup',
	name: 'MusicGroup',
	label: 'MusicGroup',
	comment:
		'A musical group, such as a band, an orchestra, or a choir. Can also be a solo musician.',
	subClassOf: ['PerformingGroup', 'Organization', 'Thing'],
	properties: [
		{
			id: 'schema:album',
			name: 'album',
			label: 'album',
			comment: 'A music album.',
			rangeIncludes: ['MusicAlbum'],
		},
		{
			id: 'schema:albums',
			name: 'albums',
			label: 'albums',
			comment: 'A collection of music albums.',
			rangeIncludes: ['MusicAlbum'],
		},
		{
			id: 'schema:genre',
			name: 'genre',
			label: 'genre',
			comment: 'Genre of the creative work, broadcast channel or group.',
			rangeIncludes: ['DefinedTerm', 'Text', 'URL'],
		},
		{
			id: 'schema:musicGroupMember',
			name: 'musicGroupMember',
			label: 'musicGroupMember',
			comment: 'A member of a music group&#x2014;for example, John, Paul, George, or Ringo.',
			rangeIncludes: ['Person'],
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

export const spec = schemaOrgMusicGroup;
export const MusicGroup = schemaOrgMusicGroup;

export default schemaOrgMusicGroup;
