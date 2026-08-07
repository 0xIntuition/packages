import type { ClassificationSpec } from '../../types.js';

export const musicGroup: ClassificationSpec = {
	slug: 'music-group',
	type: 'MusicGroup',
	displayName: 'Music Group',
	description: 'A band or artist identity.',
	category: 'Media',
	schema: { context: 'https://schema.org/', type: 'MusicGroup' },
	metadataPredicates: ['musicGroupMember', 'track', 'contain', 'hasCategory', 'sameAs'] as const,
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
		{
			key: 'sameAs',
			schemaProperty: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same music group.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/...',
		},
	],
	defaults: { pluginId: 'song', provider: 'musicbrainz' },
	identity: {
		identifies: 'an artist/band public identity',
		ladder: [
			{ kind: 'scheme', scheme: 'isni', source: { kind: 'same-as' } },
			{ kind: 'scheme', scheme: 'mbid', source: { kind: 'same-as' } },
			{ kind: 'scheme', scheme: 'wd', source: { kind: 'same-as' } },
			{ kind: 'gen1', tag: 4, recipe: [{ key: 'name', from: 'field' }] },
		],
	},
};
