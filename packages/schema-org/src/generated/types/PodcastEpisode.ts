import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPodcastEpisode = {
	id: 'schema:PodcastEpisode',
	name: 'PodcastEpisode',
	label: 'PodcastEpisode',
	comment: 'A single episode of a podcast series.',
	subClassOf: ['Episode', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPodcastEpisode;
export const PodcastEpisode = schemaOrgPodcastEpisode;

export default schemaOrgPodcastEpisode;
