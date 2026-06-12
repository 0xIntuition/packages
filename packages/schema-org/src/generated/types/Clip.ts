import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgClip = {
	id: 'schema:Clip',
	name: 'Clip',
	label: 'Clip',
	comment: 'A short TV or radio program or a segment/part of a program.',
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
			id: 'schema:clipNumber',
			name: 'clipNumber',
			label: 'clipNumber',
			comment: 'Position of the clip within an ordered group of clips.',
			rangeIncludes: ['Integer', 'Text'],
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
			id: 'schema:endOffset',
			name: 'endOffset',
			label: 'endOffset',
			comment:
				'The end time of the clip expressed as the number of seconds from the beginning of the work.',
			rangeIncludes: ['HyperTocEntry', 'Number'],
		},
		{
			id: 'schema:musicBy',
			name: 'musicBy',
			label: 'musicBy',
			comment: 'The composer of the soundtrack.',
			rangeIncludes: ['MusicGroup', 'Person'],
		},
		{
			id: 'schema:partOfEpisode',
			name: 'partOfEpisode',
			label: 'partOfEpisode',
			comment: 'The episode to which this clip belongs.',
			rangeIncludes: ['Episode'],
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
			id: 'schema:startOffset',
			name: 'startOffset',
			label: 'startOffset',
			comment:
				'The start time of the clip expressed as the number of seconds from the beginning of the work.',
			rangeIncludes: ['HyperTocEntry', 'Number'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgClip;
export const Clip = schemaOrgClip;

export default schemaOrgClip;
