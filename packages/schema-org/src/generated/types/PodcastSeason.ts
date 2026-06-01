import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPodcastSeason = {
	id: 'schema:PodcastSeason',
	name: 'PodcastSeason',
	label: 'PodcastSeason',
	comment:
		'A single season of a podcast. Many podcasts do not break down into separate seasons. In that case, PodcastSeries should be used.',
	subClassOf: ['CreativeWorkSeason', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPodcastSeason;
export const PodcastSeason = schemaOrgPodcastSeason;

export default schemaOrgPodcastSeason;
