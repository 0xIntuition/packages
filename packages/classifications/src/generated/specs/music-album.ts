import type { ClassificationSpec } from '../../types.js';

export const musicAlbum: ClassificationSpec = {
	slug: 'music-album',
	type: 'MusicAlbum',
	displayName: 'Music Album',
	description: 'A music album identity with an optional artist disambiguator.',
	category: 'Media',
	schemaOrg: { context: 'https://schema.org/', type: 'MusicAlbum' },
	fields: [
		{
			key: 'name',
			label: 'Album Name',
			description: 'The title of the album.',
			fieldType: 'string',
			required: true,
			placeholder: 'Discovery',
		},
		{
			key: 'byArtist',
			label: 'Artist',
			description: 'The artist name when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Daft Punk',
		},
	],
	defaults: { pluginId: 'song', provider: 'musicbrainz' },
};
