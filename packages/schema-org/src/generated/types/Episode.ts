import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEpisode = {
	id: 'schema:Episode',
	name: 'Episode',
	label: 'Episode',
	comment: 'A media episode (e.g. TV, radio, video game) which can be part of a series or season.',
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
			id: 'schema:duration',
			name: 'duration',
			label: 'duration',
			comment:
				'The duration of the item (movie, audio recording, event, etc.) in [ISO 8601 duration format](http://en.wikipedia.org/wiki/ISO_8601).',
			rangeIncludes: ['Duration', 'QuantitativeValue'],
		},
		{
			id: 'schema:episodeNumber',
			name: 'episodeNumber',
			label: 'episodeNumber',
			comment: 'Position of the episode within an ordered group of episodes.',
			rangeIncludes: ['Integer', 'Text'],
		},
		{
			id: 'schema:musicBy',
			name: 'musicBy',
			label: 'musicBy',
			comment: 'The composer of the soundtrack.',
			rangeIncludes: ['MusicGroup', 'Person'],
		},
		{
			id: 'schema:partOfSeason',
			name: 'partOfSeason',
			label: 'partOfSeason',
			comment: 'The season to which this episode belongs.',
			rangeIncludes: ['CreativeWorkSeason'],
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
			id: 'schema:trailer',
			name: 'trailer',
			label: 'trailer',
			comment: 'The trailer of a movie or TV/radio series, season, episode, etc.',
			rangeIncludes: ['VideoObject'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEpisode;
export const Episode = schemaOrgEpisode;

export default schemaOrgEpisode;
