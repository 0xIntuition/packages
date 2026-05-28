import type { ClassificationSpec } from '../../types.js';

export const musicRecording: ClassificationSpec = {
	slug: 'music-recording',
	type: 'MusicRecording',
	displayName: 'Music Recording',
	description: 'An individual music track with optional artist and album disambiguators.',
	category: 'Media',
	schemaOrg: { context: 'https://schema.org/', type: 'MusicRecording' },
	fields: [
		{
			key: 'name',
			label: 'Track Name',
			description: 'The track title.',
			fieldType: 'string',
			required: true,
			placeholder: 'One More Time',
		},
		{
			key: 'byArtist',
			label: 'Artist',
			description: 'The artist name when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Daft Punk',
		},
		{
			key: 'inAlbum',
			label: 'Album',
			description: 'The album name when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Discovery',
		},
	],
	defaults: { pluginId: 'song', provider: 'musicbrainz' },
};
