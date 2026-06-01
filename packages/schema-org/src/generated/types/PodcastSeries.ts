import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPodcastSeries = {
	id: 'schema:PodcastSeries',
	name: 'PodcastSeries',
	label: 'PodcastSeries',
	comment:
		'A podcast is an episodic series of digital audio or video files which a user can download and listen to.',
	subClassOf: ['CreativeWorkSeries', 'CreativeWork', 'Thing', 'Series', 'Intangible'],
	properties: [
		{
			id: 'schema:actor',
			name: 'actor',
			label: 'actor',
			comment:
				'An actor (individual or a group), e.g. in TV, radio, movie, video games etc., or in an event. Actors can be associated with individual items or with a series, episode, clip.',
			rangeIncludes: ['PerformingGroup', 'Person'],
		},
		{
			id: 'schema:webFeed',
			name: 'webFeed',
			label: 'webFeed',
			comment:
				'The URL for a feed, e.g. associated with a podcast series, blog, or series of date-stamped updates. This is usually RSS or Atom.',
			rangeIncludes: ['DataFeed', 'URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPodcastSeries;
export const PodcastSeries = schemaOrgPodcastSeries;

export default schemaOrgPodcastSeries;
