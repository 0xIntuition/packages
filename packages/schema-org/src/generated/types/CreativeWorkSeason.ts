import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCreativeWorkSeason = {
	id: 'schema:CreativeWorkSeason',
	name: 'CreativeWorkSeason',
	label: 'CreativeWorkSeason',
	comment: 'A media season, e.g. TV, radio, video game etc.',
	subClassOf: ['CreativeWork', 'Thing'],
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
			id: 'schema:director',
			name: 'director',
			label: 'director',
			comment:
				'A director of e.g. TV, radio, movie, video gaming etc. content, or of an event. Directors can be associated with individual items or with a series, episode, clip.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:endDate',
			name: 'endDate',
			label: 'endDate',
			comment:
				'The end date and time of the item (in [ISO 8601 date format](http://en.wikipedia.org/wiki/ISO_8601)).',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:episode',
			name: 'episode',
			label: 'episode',
			comment: 'An episode of a TV, radio or game media within a series or season.',
			rangeIncludes: ['Episode'],
		},
		{
			id: 'schema:episodes',
			name: 'episodes',
			label: 'episodes',
			comment: 'An episode of a TV/radio series or season.',
			rangeIncludes: ['Episode'],
		},
		{
			id: 'schema:numberOfEpisodes',
			name: 'numberOfEpisodes',
			label: 'numberOfEpisodes',
			comment: 'The number of episodes in this season or series.',
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:partOfSeries',
			name: 'partOfSeries',
			label: 'partOfSeries',
			comment: 'The series to which this episode or season belongs.',
			rangeIncludes: ['CreativeWorkSeries'],
		},
		{
			id: 'schema:productionCompany',
			name: 'productionCompany',
			label: 'productionCompany',
			comment:
				'The production company or studio responsible for the item, e.g. series, video game, episode etc.',
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:seasonNumber',
			name: 'seasonNumber',
			label: 'seasonNumber',
			comment: 'Position of the season within an ordered group of seasons.',
			rangeIncludes: ['Integer', 'Text'],
		},
		{
			id: 'schema:startDate',
			name: 'startDate',
			label: 'startDate',
			comment:
				'The start date and time of the item (in [ISO 8601 date format](http://en.wikipedia.org/wiki/ISO_8601)).',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:trailer',
			name: 'trailer',
			label: 'trailer',
			comment: 'The trailer of a movie or TV/radio series, season, episode, etc.',
			rangeIncludes: ['VideoObject'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCreativeWorkSeason;
export const CreativeWorkSeason = schemaOrgCreativeWorkSeason;

export default schemaOrgCreativeWorkSeason;
