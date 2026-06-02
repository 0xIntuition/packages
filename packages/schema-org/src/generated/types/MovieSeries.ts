import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMovieSeries = {
	id: 'schema:MovieSeries',
	name: 'MovieSeries',
	label: 'MovieSeries',
	comment: 'A series of movies. Included movies can be indicated with the hasPart property.',
	subClassOf: ['CreativeWorkSeries', 'CreativeWork', 'Series', 'Thing', 'Intangible'],
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
			id: 'schema:musicBy',
			name: 'musicBy',
			label: 'musicBy',
			comment: 'The composer of the soundtrack.',
			rangeIncludes: ['MusicGroup', 'Person'],
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
			id: 'schema:trailer',
			name: 'trailer',
			label: 'trailer',
			comment: 'The trailer of a movie or TV/radio series, season, episode, etc.',
			rangeIncludes: ['VideoObject'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMovieSeries;
export const MovieSeries = schemaOrgMovieSeries;

export default schemaOrgMovieSeries;
