import type { ClassificationSpec } from '../../types.js';

export const musicRecording: ClassificationSpec = {
	slug: 'music-recording',
	type: 'MusicRecording',
	displayName: 'Music Recording',
	description: 'An individual music track with optional artist and album disambiguators.',
	category: 'Media',
	schema: { context: 'https://schema.org/', type: 'MusicRecording' },
	metadataPredicates: ['byArtist', 'inAlbum', 'inPlaylist', 'hasCategory', 'sameAs'] as const,
	fields: [
		{
			key: 'name',
			schemaProperty: 'name',
			label: 'Track Name',
			description: 'The track title.',
			fieldType: 'string',
			required: true,
			placeholder: 'One More Time',
		},
		{
			key: 'byArtist',
			schemaProperty: 'byArtist',
			label: 'Artist',
			description: 'The artist name when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Daft Punk',
		},
		{
			key: 'inAlbum',
			schemaProperty: 'inAlbum',
			label: 'Album',
			description: 'The album name when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Discovery',
		},
		{
			key: 'isrc',
			schemaProperty: 'isrc',
			label: 'ISRC',
			description: 'The International Standard Recording Code when known.',
			fieldType: 'string',
			required: false,
			placeholder: 'USSM10007459',
		},
		{
			key: 'sameAs',
			schemaProperty: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same music recording.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/...',
		},
	],
	defaults: { pluginId: 'song', provider: 'musicbrainz' },
	identity: {
		identifies: 'the recording (isrc level; compositions are iswc territory)',
		ladder: [
			{ kind: 'scheme', scheme: 'isrc', source: { kind: 'field', key: 'isrc' } },
			{ kind: 'scheme', scheme: 'mbid', source: { kind: 'same-as' } },
			// D21: byArtist omitted (feat.-credit formatting forks); inAlbum was never identity
			{ kind: 'gen1', tag: 3, recipe: [{ key: 'name', from: 'field' }] },
		],
	},
};
