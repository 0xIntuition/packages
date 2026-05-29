import type { ClassificationSpec } from '../../types.js';

export const musicGroup: ClassificationSpec = {
	slug: 'music-group',
	type: 'MusicGroup',
	displayName: 'Music Group',
	description: 'A band or artist identity.',
	category: 'Media',
	schemaOrg: { context: 'https://schema.org/', type: 'MusicGroup' },
	fields: [
		{
			key: 'name',
			label: 'Artist or Group Name',
			description: 'The artist or group name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Daft Punk',
		},
	],
	defaults: { pluginId: 'song', provider: 'musicbrainz' },
};
