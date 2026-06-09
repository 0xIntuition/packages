import type { ClassificationSpec } from '../../types.js';

export const musicGroup: ClassificationSpec = {
	slug: 'music-group',
	type: 'MusicGroup',
	displayName: 'Music Group',
	description: 'A band or artist identity.',
	category: 'Media',
	schema: { context: 'https://schema.org/', type: 'MusicGroup' },
	metadataPredicates: ['musicGroupMember', 'track', 'contain', 'hasCategory'] as const,
	fields: [
		{
			key: 'name',
			schemaProperty: 'name',
			label: 'Artist or Group Name',
			description: 'The artist or group name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Daft Punk',
		},
	],
	defaults: { pluginId: 'song', provider: 'musicbrainz' },
};
