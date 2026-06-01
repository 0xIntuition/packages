import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRadioSeries = {
	id: 'schema:RadioSeries',
	name: 'RadioSeries',
	label: 'RadioSeries',
	comment: 'CreativeWorkSeries dedicated to radio broadcast and associated online delivery.',
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
			id: 'schema:actors',
			name: 'actors',
			label: 'actors',
			comment:
				'An actor, e.g. in TV, radio, movie, video games etc. Actors can be associated with individual items or with a series, episode, clip.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:containsSeason',
			name: 'containsSeason',
			label: 'containsSeason',
			comment: 'A season that is part of the media series.',
			rangeIncludes: ['CreativeWorkSeason'],
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
			id: 'schema:directors',
			name: 'directors',
			label: 'directors',
			comment:
				'A director of e.g. TV, radio, movie, video games etc. content. Directors can be associated with individual items or with a series, episode, clip.',
			rangeIncludes: ['Person'],
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
			id: 'schema:musicBy',
			name: 'musicBy',
			label: 'musicBy',
			comment: 'The composer of the soundtrack.',
			rangeIncludes: ['MusicGroup', 'Person'],
		},
		{
			id: 'schema:numberOfEpisodes',
			name: 'numberOfEpisodes',
			label: 'numberOfEpisodes',
			comment: 'The number of episodes in this season or series.',
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:numberOfSeasons',
			name: 'numberOfSeasons',
			label: 'numberOfSeasons',
			comment: 'The number of seasons in this series.',
			rangeIncludes: ['Integer'],
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
			id: 'schema:season',
			name: 'season',
			label: 'season',
			comment: 'A season in a media series.',
			rangeIncludes: ['CreativeWorkSeason', 'URL'],
		},
		{
			id: 'schema:seasons',
			name: 'seasons',
			label: 'seasons',
			comment: 'A season in a media series.',
			rangeIncludes: ['CreativeWorkSeason'],
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

export const spec = schemaOrgRadioSeries;
export const RadioSeries = schemaOrgRadioSeries;

export default schemaOrgRadioSeries;
