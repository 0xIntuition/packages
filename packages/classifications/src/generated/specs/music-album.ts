import type { ClassificationSpec } from '../../types.js';

export const musicAlbum: ClassificationSpec = {
	slug: 'music-album',
	type: 'MusicAlbum',
	displayName: 'Music Album',
	description: 'A music album identity with an optional artist disambiguator.',
	category: 'Media',
	schema: { context: 'https://schema.org/', type: 'MusicAlbum' },
	metadataPredicates: ['byArtist', 'track', 'contain', 'hasCategory', 'sameAs'] as const,
	fields: [
		{
			key: 'name',
			schemaProperty: 'name',
			label: 'Album Name',
			description: 'The title of the album.',
			fieldType: 'string',
			required: true,
			placeholder: 'Discovery',
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
			key: 'sameAs',
			schemaProperty: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same music album.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/...',
		},
	],
	defaults: { pluginId: 'song', provider: 'musicbrainz' },
};
